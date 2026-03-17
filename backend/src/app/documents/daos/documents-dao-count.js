const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const fs = require("fs");
const path = require("path");
const { formatToPHTime } = require("../../../middlewares/phtimezone");

const SDSSecIds = [4];
const ASDSSecIds = [7];

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

module.exports = {
  getDocumentsCount,
  getAllDocumentsCount,
  allAdminDetailsCount
};
