const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const fs = require("fs");
const path = require("path");
const { formatToPHTime } = require("../../../middlewares/phtimezone");

const SDSSecIds = [4];
const ASDSSecIds = [7];

async function getLastDocument() {
  const [lastDoc] = await prisma.documents.findMany({
    orderBy: { createdAtDateTime: "desc" },
    take: 1,
  });
  return lastDoc;
}

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

async function getAllUnits() {
  try {
    const allUnits = await prisma.units.findMany();

    return allUnits;
  } catch (error) {
    console.error("DAO: Error fetching Documents Data", error);
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

module.exports = {
  getLastDocument,
  getSDSUser,
  getAllUnits,
  filterDocLogs,
  recentDocuments,
  getAllDocuments,
  getSpecificDocuments,
  getDocumentById
};
