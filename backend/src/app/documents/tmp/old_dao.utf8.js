const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const fs = require("fs");
const path = require("path");
const { formatToPHTime } = require("../../middlewares/phtimezone");

const SDSSecIds = [4];
const ASDSSecIds = [7];

async function getSDSUser() {
  try {
    const sdsUser = await prisma.users.findFirst({
      where: {
        unitId: 1,
      },
      select: {
        firstName: true,
        middleIntl: true,
        lastName: true,
        positions: true,
      },
    });

    if (!sdsUser) {
      throw new Error("SDS user not found in the system");
    }

    // Construct full name
    const fullName = `${sdsUser.firstName}${
      sdsUser.middleIntl ? ` ${sdsUser.middleIntl}.` : ""
    } ${sdsUser.lastName}`;
    const uppercasedName = fullName.toUpperCase();

    return {
      fullName,
      uppercasedName,
      positions: sdsUser.positions,
    };
  } catch (error) {
    console.error("DAO: Error fetching SDS user", error);
    throw error;
  }
}

async function getLastDocument() {
  const [lastDoc] = await prisma.documents.findMany({
    orderBy: { createdAtDateTime: "desc" },
    take: 1,
  });
  return lastDoc;
}

async function getAllUnits() {
  try {
    const allUnits = await prisma.units.findMany();

    return allUnits;
  } catch (error) {
    console.error("DAO: Error fetching Documents Data", error);
    throw new Error(error);
  }
}

async function addDocument(data) {
  try {
    const { annotation, ...otherData } = data;

    const newDocument = await prisma.documents.create({
      data: { ...otherData, createdAtDateTime: formatToPHTime(new Date()) },
    });

    const { id, ...otherDetails } = newDocument;

    if (annotation?.annotation) {
      await prisma.annotations.create({
        data: {
          ...annotation,
          docuId: id,
          createdAt: formatToPHTime(new Date()),
        },
      });
    }

    await prisma.doclogs.create({
      data: {
        ...otherDetails,
        docuId: id,
      },
    });

    return newDocument;
  } catch (error) {
    console.error("DAO: Error creating Document", error);
    throw new Error(error);
  }
}

async function filterDocLogs(filters) {
  try {
    // Fetch filtered doclogs first
    const doclogs = await prisma.doclogs.findMany({
      where: {
        ...filters,
        ...(filters.lpsNo && {
          lpsNo: {
            contains: filters.lpsNo,
          },
        }),
        ...(filters.title && {
          title: {
            contains: filters.title,
          },
        }),
        ...(filters.primarySources && {
          primarySources: {
            array_contains: [
              {
                ...filters.primarySources,
                id: parseInt(filters.primarySources.id, 10),
              },
            ],
          },
        }),
        ...(filters.lastSource && {
          lastSource: {
            array_contains: [
              {
                ...filters.lastSource,
                id: parseInt(filters.lastSource.id, 10),
              },
            ],
          },
        }),
        ...(filters.destinations && {
          destinations: {
            array_contains: [
              {
                ...filters.destinations,
                id: parseInt(filters.destinations.id, 10),
              },
            ],
          },
        }),
      },
      orderBy: [
        {
          lastUpdateDateTime: "desc",
        },
        {
          createdAtDateTime: "desc",
        },
      ],
    });

    if (!doclogs.length) return [];

    // Collect relevant docuIds
    const docuIds = doclogs.map((d) => d.docuId);

    // Fetch annotations only for those doclogs
    const annotations = await prisma.annotations.findMany({
      where: {
        docuId: {
          in: docuIds,
        },
      },
    });

    // Group annotations by docuId for faster lookup
    const annotationsByDocuId = {};
    for (const anno of annotations) {
      if (!annotationsByDocuId[anno.docuId]) {
        annotationsByDocuId[anno.docuId] = [];
      }
      annotationsByDocuId[anno.docuId].push(anno);
    }

    // Attach filtered annotations to each doclog
    const annotatedDoclogs = doclogs.map((doclog) => {
      const annos = annotationsByDocuId[doclog.docuId] || [];

      const cutoff = doclog.lastUpdateDateTime || doclog.createdAtDateTime;
      const filteredAnnotations = annos.filter(
        (anno) => anno.createdAt <= cutoff,
      );

      return {
        ...doclog,
        annotations: filteredAnnotations,
      };
    });

    return annotatedDoclogs;
  } catch (error) {
    console.error("DAO: Error fetching doclogs data", error);
    throw new Error(error);
  }
}

async function recentDocuments(destinations) {
  try {
    // Fetch filtered doclogs first
    const doclogs = await prisma.doclogs.findMany({
      where: {
        status: 1,
        ...(destinations && {
          destinations: {
            array_contains: [
              {
                ...destinations,
                id: parseInt(destinations.id, 10),
                type: destinations.type,
              },
            ],
          },
        }),
        remarks: {
          contains: "Transmitted",
        },
      },
      orderBy: [
        {
          lastUpdateDateTime: "desc",
        },
        {
          createdAtDateTime: "desc",
        },
      ],
    });

    if (!doclogs.length) return [];

    // Collect relevant docuIds
    const docuIds = doclogs.map((d) => d.docuId);

    // Fetch annotations only for those doclogs
    const annotations = await prisma.annotations.findMany({
      where: {
        docuId: {
          in: docuIds,
        },
      },
    });

    // Group annotations by docuId for faster lookup
    const annotationsByDocuId = {};
    for (const anno of annotations) {
      if (!annotationsByDocuId[anno.docuId]) {
        annotationsByDocuId[anno.docuId] = [];
      }
      annotationsByDocuId[anno.docuId].push(anno);
    }

    // Attach filtered annotations to each doclog
    const annotatedDoclogs = doclogs.map((doclog) => {
      const annos = annotationsByDocuId[doclog.docuId] || [];

      const cutoff = doclog.lastUpdateDateTime || doclog.createdAtDateTime;
      const filteredAnnotations = annos.filter(
        (anno) => anno.createdAt <= cutoff,
      );

      return {
        ...doclog,
        annotations: filteredAnnotations,
      };
    });

    return annotatedDoclogs;
  } catch (error) {
    console.error("DAO: Error fetching recent documents", error);
    throw new Error(error);
  }
}

async function annotateDocument(docId, data) {
  try {
    const { annotation, remarks } = data;

    const annotatedDocument = await prisma.documents.update({
      where: {
        id: docId,
      },
      data: { remarks, lastUpdateDateTime: formatToPHTime(new Date()) },
    });

    const { id, ...otherDetails } = annotatedDocument;

    await prisma.annotations.create({
      data: {
        ...annotation,
        docuId: id,
        createdAt: formatToPHTime(new Date()),
      },
    });

    await prisma.doclogs.create({
      data: {
        ...otherDetails,
        docuId: id,
      },
    });

    return annotatedDocument;
  } catch (error) {
    console.error("DAO: Error annotating document", error);
    throw new Error(error);
  }
}

async function updateAnnotation(docId, data) {
  try {
    const { annotation, remarks } = data;

    const annotatedDocument = await prisma.documents.update({
      where: {
        id: docId,
      },
      data: { remarks },
    });

    const { id, ...otherDetails } = annotatedDocument;

    const updatedAnnotation = await prisma.annotations.update({
      where: {
        id: annotation.id,
      },
      data: {
        ...annotation,
        dateUpdated: formatToPHTime(new Date()),
      },
    });

    await prisma.doclogs.create({
      data: {
        ...otherDetails,
        docuId: id,
      },
    });

    return updatedAnnotation;
  } catch (error) {
    console.error("DAO: Error annotating document", error);
    throw new Error(error);
  }
}

async function deleteAnnotation(annotationId) {
  try {
    const deletedAnnotation = await prisma.annotations.delete({
      where: {
        id: annotationId,
      },
    });

    return deletedAnnotation;
  } catch (error) {
    console.error("DAO: Error annotating document", error);
    throw new Error(error);
  }
}

async function transmitDocs(documents, updateFields) {
  try {
    const ids = documents.map((data) => data.id);
    const [annotation, ...otherDetails] = updateFields;

    // Use a single transaction to update documents and create logs
    const transmittedDocuments = await prisma.$transaction(async (prisma) => {
      // Update the documents

      const transmittedDocs = await prisma.documents.updateMany({
        where: {
          id: {
            in: ids,
          },
        },
        data: {
          ...otherDetails,
          status: 1,
          lastUpdateDateTime: formatToPHTime(new Date()),
        },
      });

      if (annotation?.annotation) {
        const annotationPromises = transmittedDocs.map(async (doc) => {
          return await prisma.annotations.create({
            data: {
              ...annotation,
              docuId: doc.id,
              createdAt: formatToPHTime(new Date()),
            },
          });
        });

        await Promise.all(annotationPromises);
      }

      // Retrieve the updated documents to get their details
      const updatedDocs = await prisma.documents.findMany({
        where: {
          id: {
            in: ids,
          },
        },
      });

      // Create log entries for each updated document
      const logPromises = updatedDocs.map(async (doc) => {
        const { id, ...otherDetails } = doc;
        return prisma.doclogs.create({
          data: {
            ...otherDetails,
            docuId: id,
          },
        });
      });

      await Promise.all(logPromises);

      return transmittedDocs;
    });

    return transmittedDocuments;
  } catch (error) {
    console.error(`DAO: Error transmitting documents: ${error.message}`);
    throw error;
  }
}

async function acceptDocuments(documents, updateFields) {
  try {
    const acceptedDocuments = await prisma.$transaction(async (prisma) => {
      const updatedDocs = await Promise.all(
        documents.map(async (doc) => {
          const dataToUpdate = {
            ...updateFields,
            ...(!updateFields?.status && {
              status:
                doc.classification === 1
                  ? 7
                  : doc.classification === 2
                    ? 8
                    : doc.classification === 4
                      ? 3
                      : 3,
            }),
            acceptStatus: 1,
            lastUpdateDateTime: formatToPHTime(new Date()),
            lastAcceptedDateTime: formatToPHTime(new Date()),
          };

          if (!doc.firstAcceptedDateTime) {
            dataToUpdate.firstAcceptedDateTime = formatToPHTime(new Date());
          }

          const updatedDoc = await prisma.documents.update({
            where: { id: doc.id },
            data: dataToUpdate,
          });

          const { id: docuId, ...otherDetails } = updatedDoc;

          await prisma.doclogs.create({
            data: {
              ...otherDetails,
              docuId,
            },
          });

          return updatedDoc;
        }),
      );

      return updatedDocs;
    });

    return acceptedDocuments;
  } catch (error) {
    console.error(`DAO: Error accepting documents: ${error.message}`);
    throw error;
  }
}

async function getDocumentsCount(auth) {
  try {
    let incoming = 0;
    let outgoing = 0;
    let pending = 0;
    let saved = 0;
    let onHold = 0;
    let lapsed = 0;
    let signed = 0;
    let uploaded = 0;

    let forRelease = 0;

    let forSigning = 0;
    let forRouting = 0;
    let routedIn = 0;
    let routedOut = 0;

    let allRouted = 0;
    let allCompleted = 0;
    let allOngoing = 0;
    let allLapsed = 0;

    const allOutgoingCandidates = await prisma.documents.findMany({
      where: {
        currentOwner: {
          array_contains: [{ id: auth.id }],
        },
        // NOT: {
        //   destinations: {
        //     array_contains: [{ id: auth.id, type: "unit" }],
        //   },
        // },
        status: {
          in: [1, 8],
        },
      },
      select: {
        id: true,
        lastSource: true,
        primarySources: true,
      },
    });

    const currentDate = new Date();

    const complexityThresholds = {
      1: 3 * 24 * 60 * 60 * 1000,
      2: 7 * 24 * 60 * 60 * 1000,
      3: 1 * 24 * 60 * 60 * 1000,
      4: 20 * 24 * 60 * 60 * 1000,
    };

    const lapsedCandidates = await prisma.documents.findMany({
      where: {
        status: 3,
        classification: { not: 4 },
        acceptStatus: 1,
        destinations: {
          array_contains: [
            {
              id: auth.id,
              type: auth.type,
            },
          ],
        },
      },
      select: {
        id: true,
        createdAtDateTime: true,
        complexity: true,
      },
    });

    lapsed = lapsedCandidates.filter((doc) => {
      const createdAt = new Date(doc.createdAtDateTime);
      const threshold = complexityThresholds[doc.complexity] || 0;
      return currentDate.getTime() >= createdAt.getTime() + threshold;
    }).length;

    const allLapsedDocuments = await prisma.documents.findMany({
      where: {
        status: { not: 4 },
        routedBy: {
          array_contains: [
            {
              id: auth.id,
              type: auth.type,
            },
          ],
        },
        classification: { not: 4 },
        acceptStatus: 1,
      },
      select: {
        id: true,
        createdAtDateTime: true,
        complexity: true,
      },
    });

    const allReleaseCandidates = await prisma.documents.findMany({
      where: {
        NOT: {
          currentOwner: {
            array_contains: [{ id: auth.id }],
          },
        },
        status: 8,
        acceptStatus: 0,
      },
      select: {
        lastSource: true,
      },
    });

    // ================================================================= //

    allRouted = await prisma.documents.count({
      where: {
        routedBy: {
          array_contains: [
            {
              id: auth.id,
              type: auth.type,
            },
          ],
        },
      },
    });

    allCompleted = await prisma.documents.count({
      where: {
        status: 4,
        routedBy: {
          array_contains: [
            {
              id: auth.id,
              type: auth.type,
            },
          ],
        },
      },
    });

    allOngoing = await prisma.documents.count({
      where: {
        status: { not: 4 },
        routedBy: {
          array_contains: [
            {
              id: auth.id,
              type: auth.type,
            },
          ],
        },
      },
    });

    allLapsed = allLapsedDocuments.filter((doc) => {
      const createdAt = new Date(doc.createdAtDateTime);
      const threshold = complexityThresholds[doc.complexity] || 0;
      return currentDate.getTime() >= createdAt.getTime() + threshold;
    }).length;

    incoming = await prisma.documents.count({
      where: {
        OR: [
          {
            status: 1,
            destinations: {
              array_contains: [
                {
                  id: auth.id,
                  type: auth.type,
                },
              ],
            },
            NOT: {
              currentOwner: {
                array_contains: [{ id: auth.id === 12 ? 10000 : auth.id }],
              },
            },
          },
          {
            status: 2,
            destinations: {
              array_contains: [
                {
                  id: auth.id,
                  type: auth.type,
                },
              ],
            },
          },
        ],
      },
    });

    outgoing = allOutgoingCandidates.filter((doc) => {
      const last = doc.lastSource?.[doc.lastSource.length - 1];

      return (
        doc.primarySources.some(
          (prim) => prim?.id === auth.id && prim?.type === auth.type,
        ) ||
        (last?.id === auth.id && last?.type === auth.type)
      );
    }).length;

    pending = await prisma.documents.count({
      where: {
        status: 3,
        destinations: {
          array_contains: [
            {
              type: auth.type,
            },
          ],
        },
        classification: { not: 4 },
        currentOwner: {
          array_contains: [{ id: auth.id }],
        },
      },
    });

    saved = await prisma.documents.count({
      where: {
        status: 4,
        destinations: {
          array_contains: [
            {
              id: auth.id,
              type: auth.type,
            },
          ],
        },
        currentOwner: {
          array_contains: [{ id: auth.id }],
        },
      },
    });

    onHold = await prisma.documents.count({
      where: {
        status: 5,
        destinations: {
          array_contains: [
            {
              id: auth.id,
              type: auth.type,
            },
          ],
        },
        currentOwner: {
          array_contains: [{ id: auth.id }],
        },
      },
    });

    signed = await prisma.documents.count({
      where: {
        signedDateTime: {
          not: null,
        },
        primarySources: {
          array_contains: [
            {
              id: auth.id,
              type: auth.type,
            },
          ],
        },
      },
    });

    uploaded = await prisma.documents.count({
      where: {
        primarySources: {
          array_contains: [
            {
              id: auth.id,
              type: auth.type,
            },
          ],
        },
      },
    });

    forRelease = allReleaseCandidates.filter((doc) => {
      const last = doc.lastSource?.[doc.lastSource.length - 1];

      return last?.id === auth.id;
    }).length;

    forSigning = await prisma.documents.count({
      where: {
        destinations: {
          array_contains: [
            {
              id: auth.id,
              type: "unit",
            },
          ],
        },
        status: 7,
        acceptStatus: 1,
      },
    });

    forRouting = await prisma.documents.count({
      where: {
        destinations: {
          array_contains: [
            {
              id: auth.id,
              type: "unit",
            },
          ],
        },
        status: 8,
        acceptStatus: 1,
      },
    });

    routedIn = await prisma.documents.count({
      where: {
        destinations: {
          array_contains: [
            {
              id: auth.id,
              type: auth.type,
            },
          ],
        },
        status: 3,
        classification: 4,
      },
    });

    routedOut = await prisma.documents.count({
      where: {
        routedBy: {
          array_contains: [
            {
              id: auth.id,
            },
          ],
        },
        classification: 4,
      },
    });

    if ((auth.id === 1 || auth.id === 2) && auth.type === "unit") {
      signed = await prisma.documents.count({
        where: {
          OR: [
            {
              autoInitials: {
                array_contains: [{ id: auth.unitId }],
              },
            },
            {
              manualInitials: {
                array_contains: [{ id: auth.unitId }],
              },
            },
          ],
        },
      });
    } else if (SDSSecIds.includes(auth.id) && auth.type === "unit") {
      const allOutgoingCandidates = await prisma.documents.findMany({
        where: {
          OR: [
            {
              destinations: {
                array_contains: [{ id: 1, type: "unit" }],
              },
              OR: SDSSecIds.map((id) => ({
                currentOwner: {
                  array_contains: [{ id }],
                },
              })),
              status: { in: [1, 8] },
            },
            {
              OR: SDSSecIds.map((id) => ({
                currentOwner: {
                  array_contains: [{ id }],
                },
              })),
              NOT: {
                destinations: {
                  array_contains: [{ id: 1 }],
                },
              },
              status: {
                in: [1, 8],
              },
            },
          ],
        },
        select: {
          id: true,
          lastSource: true,
          primarySources: true,
        },
      });

      // =================================================================

      // Changed this one.. Watch out
      incoming = await prisma.documents.count({
        where: {
          status: { in: [1, 2] },
          OR: SDSSecIds.map((id) => ({
            destinations: {
              array_contains: [{ id, type: "unit" }],
            },
          })),
          NOT: {
            currentOwner: {
              array_contains: [{ id: { in: SDSSecIds } }],
            },
          },
        },
      });

      outgoing = allOutgoingCandidates.filter((doc) => {
        const last = doc.lastSource?.[doc.lastSource.length - 1];

        return (
          doc.primarySources.some(
            (prim) => prim?.id === auth.id && prim?.type === auth.type,
          ) ||
          (last?.id === auth.id && last?.type === "unit")
        );
      }).length;

      pending = await prisma.documents.count({
        where: {
          status: 3,
          destinations: {
            array_contains: [{ type: "unit" }],
          },
          classification: { not: 4 },
          OR: SDSSecIds.map((id) => ({
            currentOwner: {
              array_contains: [{ id, type: "unit" }],
            },
          })),
        },
      });

      routedOut = await prisma.documents.count({
        where: {
          routedBy: {
            array_contains: [
              {
                id: 1,
              },
            ],
          },
          classification: 4,
        },
      });
    } else if (ASDSSecIds.includes(auth.id) && auth?.type === "unit") {
      const allOutgoingCandidates = await prisma.documents.findMany({
        where: {
          OR: [
            {
              destinations: {
                array_contains: [{ id: 2, type: "unit" }],
              },
              OR: ASDSSecIds.map((id) => ({
                currentOwner: {
                  array_contains: [{ id }],
                },
              })),
              status: { in: [1, 8] },
            },
            {
              OR: ASDSSecIds.map((id) => ({
                currentOwner: {
                  array_contains: [{ id }],
                },
              })),
              NOT: {
                destinations: {
                  array_contains: [{ id: 2, type: "unit" }],
                },
              },
              status: {
                in: [1, 8],
              },
            },
          ],
        },
        select: {
          id: true,
          lastSource: true,
          primarySources: true,
        },
      });

      // =================================================================

      // Changed this one.. Watch out
      incoming = await prisma.documents.count({
        where: {
          status: { in: [1, 2] },
          OR: ASDSSecIds.map((id) => ({
            destinations: {
              array_contains: [{ id, type: "unit" }],
            },
          })),
          NOT: {
            currentOwner: {
              array_contains: [{ id: { in: ASDSSecIds } }],
            },
          },
        },
      });

      outgoing = allOutgoingCandidates.filter((doc) => {
        const last = doc.lastSource?.[doc.lastSource.length - 1];

        return (
          doc.primarySources.some(
            (prim) => prim?.id === auth.id && prim?.type === auth.type,
          ) ||
          (last?.id === auth.id && last?.type === "unit")
        );
      }).length;

      routedOut = await prisma.documents.count({
        where: {
          routedBy: {
            array_contains: [
              {
                id: 2,
              },
            ],
          },
          classification: 4,
        },
      });
    }

    return {
      incoming,
      outgoing,
      pending,
      saved,
      onHold,
      lapsed,
      forRelease,
      routedIn,
      routedOut,
      forRouting,
      forSigning,
      signed,
      uploaded,
      allRouted,
      allCompleted,
      allOngoing,
      allLapsed,
    };
  } catch (error) {
    console.error("DAO: Error getting documents count", error);
    throw new Error(error);
  }
}

async function getAllDocumentsCount() {
  try {
    const allDocumentsCount = await prisma.documents.count();

    return allDocumentsCount;
  } catch (error) {
    console.error("DAO: Error getting all documents count", error);
    throw new Error(error);
  }
}

async function allAdminDetailsCount() {
  try {
    let docTypes = 0;
    let offices = 0;
    let units = 0;
    let users = 0;

    docTypes = await prisma.doctypes.count();
    offices = await prisma.offices.count();
    units = await prisma.units.count();
    users = await prisma.users.count();

    return { docTypes, offices, units, users };
  } catch (error) {
    console.error("DAO: Error getting all admin details count", error);
    throw new Error(error);
  }
}

async function getAllDocuments() {
  try {
    let allDocuments = await prisma.documents.findMany({
      include: {
        annotations: true,
      },
      orderBy: { complexity: "desc" },
    });

    allDocuments.sort((a, b) => {
      const dateA = a.lastUpdateDateTime || a.createdAtDateTime;
      const dateB = b.lastUpdateDateTime || b.createdAtDateTime;
      return new Date(dateB) - new Date(dateA);
    });

    return allDocuments;
  } catch (error) {
    console.error("DAO: Error fetching Documents Data", error);
    throw new Error(error);
  }
}

async function getSpecificDocuments(auth, category) {
  try {
    let documents = [];

    if (category === "incoming") {
      documents = await prisma.documents.findMany({
        where: {
          OR: [
            {
              status: 1,
              destinations: {
                array_contains: [
                  {
                    id: auth.id,
                    type: auth.type,
                  },
                ],
              },
              NOT: {
                currentOwner: {
                  array_contains: [{ id: auth.id === 12 ? 10000 : auth.id }],
                },
              },
            },
            {
              status: 2,
              destinations: {
                array_contains: [
                  {
                    id: auth.id,
                    type: auth.type,
                  },
                ],
              },
            },
          ],
        },
        include: {
          annotations: true,
        },
      });

      if (SDSSecIds.includes(auth.id) && auth?.type === "unit") {
        documents = await prisma.documents.findMany({
          where: {
            status: { in: [1, 2] },
            OR: SDSSecIds.map((id) => ({
              destinations: {
                array_contains: [{ id, type: "unit" }],
              },
            })),
            NOT: {
              currentOwner: {
                array_contains: [{ id: { in: SDSSecIds } }],
              },
            },
          },
          include: {
            annotations: true,
          },
        });
      } else if (ASDSSecIds.includes(auth.id) && auth?.type === "unit") {
        documents = await prisma.documents.findMany({
          where: {
            status: { in: [1, 2] },
            OR: ASDSSecIds.map((id) => ({
              destinations: {
                // Changed this
                array_contains: [{ id, type: "unit" }],
              },
            })),
            NOT: {
              currentOwner: {
                array_contains: [{ id: { in: ASDSSecIds } }],
              },
            },
          },
          include: {
            annotations: true,
          },
        });
      }
    } else if (category === "outgoing") {
      const allOutgoingCandidates = await prisma.documents.findMany({
        where: {
          currentOwner: {
            array_contains: [{ id: auth.id }],
          },
          status: {
            in: [1, 8],
          },
        },
        include: {
          annotations: true,
        },
      });

      documents = allOutgoingCandidates.filter((doc) => {
        const last = doc.lastSource?.[doc.lastSource.length - 1];

        return (
          doc.primarySources.some(
            (prim) => prim?.id === auth.id && prim?.type === auth.type,
          ) ||
          (last?.id === auth.id && last?.type === auth.type)
        );
      });

      if (SDSSecIds.includes(auth.id) && auth?.type === "unit") {
        const allOutgoingCandidates = await prisma.documents.findMany({
          where: {
            OR: [
              {
                destinations: {
                  array_contains: [{ id: 1, type: "unit" }],
                },
                OR: SDSSecIds.map((id) => ({
                  currentOwner: {
                    array_contains: [{ id }],
                  },
                })),
                status: { in: [1, 8] },
              },
              {
                OR: SDSSecIds.map((id) => ({
                  currentOwner: {
                    array_contains: [{ id }],
                  },
                })),
                NOT: {
                  destinations: {
                    array_contains: [{ id: 1 }],
                  },
                },
                status: {
                  in: [1, 8],
                },
              },
            ],
          },
          include: {
            annotations: true,
          },
        });

        // =================================================================

        documents = allOutgoingCandidates.filter((doc) => {
          const last = doc.lastSource?.[doc.lastSource.length - 1];

          return (
            doc.primarySources.some(
              (prim) => prim?.id === auth.id && prim?.type === auth.type,
            ) ||
            (last?.id === auth.id && last?.type === "unit")
          );
        });
      } else if (ASDSSecIds.includes(auth.id) && auth?.type === "unit") {
        const allOutgoingCandidates = await prisma.documents.findMany({
          where: {
            OR: [
              {
                destinations: {
                  array_contains: [{ id: 2, type: "unit" }],
                },
                OR: ASDSSecIds.map((id) => ({
                  currentOwner: {
                    array_contains: [{ id }],
                  },
                })),
                status: { in: [1, 8] },
              },
              {
                OR: ASDSSecIds.map((id) => ({
                  currentOwner: {
                    array_contains: [{ id }],
                  },
                })),
                NOT: {
                  destinations: {
                    array_contains: [{ id: 2, type: "unit" }],
                  },
                },
                status: {
                  in: [1, 8],
                },
              },
            ],
          },
          include: {
            annotations: true,
          },
        });

        // =================================================================

        documents = allOutgoingCandidates.filter((doc) => {
          const last = doc.lastSource?.[doc.lastSource.length - 1];

          return (
            doc.primarySources.some(
              (prim) => prim?.id === auth.id && prim?.type === auth.type,
            ) ||
            (last?.id === auth.id && last?.type === "unit")
          );
        });
      }
    } else if (category === "pending") {
      documents = await prisma.documents.findMany({
        where: {
          status: 3,
          destinations: {
            array_contains: [
              {
                type: auth.type,
              },
            ],
          },
          classification: { not: 4 },
          currentOwner: {
            array_contains: [{ id: auth.id }],
          },
        },
        include: {
          annotations: true,
        },
      });

      if (SDSSecIds.includes(auth.id) && auth?.type === "unit") {
        documents = await prisma.documents.findMany({
          where: {
            status: 3,
            destinations: {
              array_contains: [{ type: "unit" }],
            },
            classification: { not: 4 },
            OR: SDSSecIds.map((id) => ({
              currentOwner: {
                array_contains: [{ id }],
              },
            })),
          },
          include: {
            annotations: true,
          },
        });
      }
    } else if (category === "saved") {
      documents = await prisma.documents.findMany({
        where: {
          status: 4,
          destinations: {
            array_contains: [
              {
                id: auth.id,
                type: auth.type,
              },
            ],
          },
          currentOwner: {
            array_contains: [{ id: auth.id }],
          },
        },
        include: {
          annotations: true,
        },
      });
    } else if (category === "onHold") {
      documents = await prisma.documents.findMany({
        where: {
          status: 5,
          destinations: {
            array_contains: [
              {
                id: auth.id,
                type: auth.type,
              },
            ],
          },
          currentOwner: {
            array_contains: [{ id: auth.id }],
          },
        },
        include: {
          annotations: true,
        },
      });
    } else if (category === "lapsed") {
      const currentDate = new Date();

      const complexityThresholds = {
        1: 3 * 24 * 60 * 60 * 1000,
        2: 7 * 24 * 60 * 60 * 1000,
        3: 1 * 24 * 60 * 60 * 1000,
        4: 20 * 24 * 60 * 60 * 1000,
      };

      const lapsedCandidates = await prisma.documents.findMany({
        where: {
          status: 3,
          classification: { not: 4 },
          acceptStatus: 1,
          destinations: {
            array_contains: [
              {
                id: auth.id,
                type: auth.type,
              },
            ],
          },
        },
        include: {
          annotations: true,
        },
      });

      documents = lapsedCandidates.filter((doc) => {
        const createdAt = new Date(doc.createdAtDateTime);
        const threshold = complexityThresholds[doc.complexity] || 0;
        return currentDate.getTime() >= createdAt.getTime() + threshold;
      });
    } else if (category === "signed") {
      documents = await prisma.documents.findMany({
        where: {
          signedDateTime: {
            not: null,
          },
          primarySources: {
            array_contains: [
              {
                id: auth.id,
                type: auth.type,
              },
            ],
          },
        },
        include: {
          annotations: true,
        },
      });

      if ((auth.id === 1 || auth.id === 2) && auth.type === "unit") {
        documents = await prisma.documents.findMany({
          where: {
            OR: [
              {
                autoInitials: {
                  array_contains: [{ id: auth.unitId }],
                },
              },
              {
                manualInitials: {
                  array_contains: [{ id: auth.unitId }],
                },
              },
            ],
          },
          include: {
            annotations: true,
          },
        });
      }
    } else if (category === "uploaded") {
      documents = await prisma.documents.findMany({
        where: {
          primarySources: {
            array_contains: [
              {
                id: auth.id,
                type: auth.type,
              },
            ],
          },
        },
        include: {
          annotations: true,
        },
      });
    } else if (category === "forRelease") {
      const allReleaseCandidates = await prisma.documents.findMany({
        where: {
          NOT: {
            currentOwner: {
              array_contains: [{ id: auth.id }],
            },
          },
          status: 8,
          acceptStatus: 0,
        },
        include: {
          annotations: true,
        },
      });

      documents = allReleaseCandidates.filter((doc) => {
        const last = doc.lastSource?.[doc.lastSource.length - 1];

        return last?.id === auth.id;
      });
    } else if (category === "forSigning") {
      documents = await prisma.documents.findMany({
        where: {
          destinations: {
            array_contains: [
              {
                id: auth.id,
                type: "unit",
              },
            ],
          },
          status: 7,
          acceptStatus: 1,
        },
        include: {
          annotations: true,
        },
      });
    } else if (category === "forRouting") {
      documents = await prisma.documents.findMany({
        where: {
          destinations: {
            array_contains: [
              {
                id: auth.id,
                type: "unit",
              },
            ],
          },
          status: 8,
          acceptStatus: 1,
        },
        include: {
          annotations: true,
        },
      });
    } else if (category === "routedIn") {
      documents = await prisma.documents.findMany({
        where: {
          destinations: {
            array_contains: [
              {
                id: auth.id,
                type: auth.type,
              },
            ],
          },
          status: 3,
          classification: 4,
        },
        include: {
          annotations: true,
        },
      });
    } else if (category === "routedOut") {
      documents = await prisma.documents.findMany({
        where: {
          routedBy: {
            array_contains: [
              {
                id: auth.id,
              },
            ],
          },
          classification: 4,
        },
        include: {
          annotations: true,
        },
      });

      if (SDSSecIds.includes(auth.id) && auth?.type === "unit") {
        documents = await prisma.documents.findMany({
          where: {
            routedBy: {
              array_contains: [
                {
                  id: 1,
                },
              ],
            },
            classification: 4,
          },
          include: {
            annotations: true,
          },
        });
      } else if (ASDSSecIds.includes(auth.id) && auth?.type === "unit") {
        documents = await prisma.documents.findMany({
          where: {
            routedBy: {
              array_contains: [
                {
                  id: 2,
                },
              ],
            },
            classification: 4,
          },
          include: {
            annotations: true,
          },
        });
      }
    } else if (category === "signed") {
      documents = await prisma.documents.findMany({
        where: {
          signedDateTime: {
            not: null,
          },
          primarySources: {
            array_contains: [
              {
                id: auth.id,
                type: auth.type,
              },
            ],
          },
        },
        include: {
          annotations: true,
        },
      });

      if ((auth.id === 1 || auth.id === 2) && auth.type === "unit") {
        documents = await prisma.documents.findMany({
          where: {
            OR: [
              {
                autoInitials: {
                  array_contains: [{ id: auth.unitId }],
                },
              },
              {
                manualInitials: {
                  array_contains: [{ id: auth.unitId }],
                },
              },
            ],
          },
          include: {
            annotations: true,
          },
        });
      }
    } else if (category === "routed") {
      documents = await prisma.documents.findMany({
        where: {
          routedBy: {
            array_contains: [
              {
                id: auth.id,
                type: auth.type,
              },
            ],
          },
        },
        include: {
          annotations: true,
        },
      });

      if (SDSSecIds.includes(auth.id) && auth?.type === "unit") {
        documents = await prisma.documents.findMany({
          where: {
            routedBy: {
              array_contains: [
                {
                  id: 1,
                },
              ],
            },
            classification: 4,
          },
          include: {
            annotations: true,
          },
        });
      } else if (ASDSSecIds.includes(auth.id) && auth?.type === "unit") {
        documents = await prisma.documents.findMany({
          where: {
            routedBy: {
              array_contains: [
                {
                  id: 2,
                },
              ],
            },
            classification: 4,
          },
          include: {
            annotations: true,
          },
        });
      }
    } else if (category === "completed") {
      documents = await prisma.documents.findMany({
        where: {
          status: 4,
          routedBy: {
            array_contains: [
              {
                id: auth.id,
                type: auth.type,
              },
            ],
          },
        },
        include: {
          annotations: true,
        },
      });
    } else if (category === "ongoing") {
      documents = await prisma.documents.findMany({
        where: {
          status: { not: 4 },
          routedBy: {
            array_contains: [
              {
                id: auth.id,
                type: auth.type,
              },
            ],
          },
        },
        include: {
          annotations: true,
        },
      });

      if (SDSSecIds.includes(auth.id) && auth?.type === "unit") {
        documents = await prisma.documents.findMany({
          where: {
            status: 3,
            destinations: {
              array_contains: [{ type: "unit" }],
            },
            classification: { not: 4 },
            OR: SDSSecIds.map((id) => ({
              currentOwner: {
                array_contains: [{ id }],
              },
            })),
          },
          include: {
            annotations: true,
          },
        });
      }
    } else if (category === "overdue") {
      const currentDate = new Date();

      const complexityThresholds = {
        1: 3 * 24 * 60 * 60 * 1000,
        2: 7 * 24 * 60 * 60 * 1000,
        3: 1 * 24 * 60 * 60 * 1000,
        4: 20 * 24 * 60 * 60 * 1000,
      };

      const lapsedCandidates = await prisma.documents.findMany({
        where: {
          status: { not: 4 },
          routedBy: {
            array_contains: [
              {
                id: auth.id,
                type: auth.type,
              },
            ],
          },
          classification: { not: 4 },
          acceptStatus: 1,
        },
        include: {
          annotations: true,
        },
      });

      documents = lapsedCandidates.filter((doc) => {
        const createdAt = new Date(doc.createdAtDateTime);
        const threshold = complexityThresholds[doc.complexity] || 0;
        return currentDate.getTime() >= createdAt.getTime() + threshold;
      });
    }

    documents.sort((a, b) => {
      const dateA = a.lastUpdateDateTime || a.createdAtDateTime;
      const dateB = b.lastUpdateDateTime || b.createdAtDateTime;
      return new Date(dateB) - new Date(dateA);
    });

    return documents;
  } catch (error) {
    console.error("DAO: Error getting specific documents", error);
    throw new Error(error);
  }
}

async function getDocumentById(docId) {
  try {
    const document = await prisma.documents.findUnique({
      where: { id: docId },
    });

    return document;
  } catch (error) {
    console.error("DAO: Error fetching Document Data", error);
    throw new Error(error);
  }
}

async function updateDocument(docId, data) {
  try {
    const { annotation, ...otherData } = data;

    const updatedDocument = await prisma.documents.update({
      where: {
        id: docId,
      },
      data: {
        ...otherData,
        lastUpdateDateTime: formatToPHTime(new Date()),
      },
    });

    const { id, ...otherDetails } = updatedDocument;

    if (annotation?.annotation) {
      await prisma.annotations.create({
        data: {
          ...annotation,
          docuId: id,
          createdAt: formatToPHTime(new Date()),
        },
      });
    }

    await prisma.doclogs.create({
      data: {
        ...otherDetails,
        docuId: id,
      },
    });

    return updatedDocument;
  } catch (error) {
    console.error("DAO: Error updating Document", error);
    throw new Error(error);
  }
}

async function revertDocument(docId, data, remarks) {
  try {
    const revertedDocument = await prisma.documents.update({
      where: {
        id: docId,
      },
      data,
    });

    const { id, ...otherDetails } = revertedDocument;

    await prisma.doclogs.create({
      data: {
        ...otherDetails,
        docuId: id,
        lastUpdateDateTime: formatToPHTime(new Date()),
        remarks,
      },
    });

    return revertedDocument;
  } catch (error) {
    console.error("DAO: Error reverted Document", error);
    throw new Error(error);
  }
}

async function deleteDocuments(documents) {
  try {
    const deletedDocuments = await prisma.$transaction(async (prisma) => {
      const deletedDocs = await Promise.all(
        documents.map(async (doc) => {
          const parsedFiles = doc.files || [];

          // Delete the existing files in parsedFiles
          parsedFiles.forEach((file) => {
            if (file) {
              const filePath = path.join(__dirname, `../../uploads/${file}`); // Ensure correct path
              try {
                fs.unlinkSync(filePath);
              } catch (err) {
                if (err.code !== "ENOENT") {
                  // If the error is something other than "file not found", rethrow the error
                  throw err;
                }
                // If file is not found (ENOENT), do nothing
              }
            }
          });

          const deletedDoc = await prisma.documents.delete({
            where: {
              id: doc?.id,
            },
          });

          await prisma.annotations.deleteMany({
            where: {
              docuId: doc.id,
            },
          });

          const { id: docuId, ...otherDetails } = deletedDoc;

          await prisma.doclogs.create({
            data: {
              ...otherDetails,
              docuId,
              status: 0,
            },
          });

          return deletedDoc;
        }),
      );

      return deletedDocs;
    });

    return deletedDocuments;
  } catch (error) {
    console.error("DAO: Error deleting Document", error);
    throw new Error(error);
  }
}

// System settings DAO functions
async function getSystemSetting(key) {
  try {
    const setting = await prisma.systemsettings.findUnique({
      where: { key },
    });

    return setting;
  } catch (error) {
    console.error("DAO: Error getting system setting:", error);
    throw error;
  }
}

async function updateSystemSetting(key, value, updatedBy) {
  try {
    const setting = await prisma.systemsettings.upsert({
      where: { key },
      update: {
        value,
        updatedBy,
        updatedAt: new Date(),
      },
      create: {
        key,
        value,
        updatedBy,
        category: "documents",
        description: "System setting for document validation",
      },
    });

    return setting;
  } catch (error) {
    console.error("DAO: Error updating system setting:", error);
    throw error;
  }
}

async function getAllSystemSettings() {
  try {
    const settings = await prisma.systemsettings.findMany({
      where: { isActive: true },
      orderBy: [{ category: "asc" }, { key: "asc" }],
    });

    return settings;
  } catch (error) {
    console.error("DAO: Error getting all system settings:", error);
    throw error;
  }
}

module.exports = {
  getLastDocument,
  getSDSUser,

  getAllUnits,

  addDocument,
  updateDocument,
  revertDocument,
  filterDocLogs,
  recentDocuments,
  annotateDocument,
  updateAnnotation,
  deleteAnnotation,
  transmitDocs,
  acceptDocuments,

  getDocumentsCount,
  getAllDocumentsCount,
  allAdminDetailsCount,

  getAllDocuments,
  getSpecificDocuments,
  getDocumentById,
  deleteDocuments,

  // System settings
  getSystemSetting,
  updateSystemSetting,
  getAllSystemSettings,
};
