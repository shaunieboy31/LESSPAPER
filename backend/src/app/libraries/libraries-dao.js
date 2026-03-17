const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Units and Offices
async function getDestinations() {
  try {
    const offices = await prisma.offices.findMany();
    const units = await prisma.units.findMany();

    const formattedOffices = offices.map((office) => {
      const formattedOffice = {
        ...office,
        destination: office?.office,
        type: "office",
      };
      delete formattedOffice.office;
      return formattedOffice;
    });

    const formattedUnits = units.map((unit) => {
      const formattedUnit = { ...unit, destination: unit?.unit, type: "unit" };
      delete formattedUnit.unit;
      return formattedUnit;
    });

    const destinations = { offices: formattedOffices, units: formattedUnits };

    return destinations;
  } catch (error) {
    throw error;
  }
}

// Office APIs
async function addOffice(data) {
  try {
    const newOffice = await prisma.offices.create({
      data,
    });

    return newOffice;
  } catch (error) {
    throw error;
  }
}

async function getAllOffices() {
  try {
    const allOffices = await prisma.offices.findMany();

    return allOffices;
  } catch (error) {
    throw error;
  }
}

async function getOfficeById(officeId) {
  try {
    const office = await prisma.offices.findUnique({ where: { id: officeId } });

    return office;
  } catch (error) {
    throw error;
  }
}

async function updateOffice(id, data) {
  try {
    const updatedOffice = await prisma.offices.update({
      where: {
        id: id,
      },
      data: data,
    });

    return updatedOffice;
  } catch (error) {
    throw error;
  }
}

async function deleteOffice(id) {
  try {
    const deletedOffice = await prisma.offices.delete({
      where: {
        id: id,
      },
    });

    return deletedOffice;
  } catch (error) {
    throw error;
  }
}

// Unit APIs
async function addUnit(data) {
  try {
    const newUnit = await prisma.units.create({
      data,
    });

    return newUnit;
  } catch (error) {
    throw error;
  }
}

async function getAllUnits() {
  try {
    const allUnits = await prisma.units.findMany();

    return allUnits;
  } catch (error) {
    throw error;
  }
}

async function getUnitById(unitId) {
  try {
    const unit = await prisma.units.findUnique({ where: { id: unitId } });

    return unit;
  } catch (error) {
    throw error;
  }
}

async function updateUnit(id, data) {
  try {
    const updatedUnit = await prisma.units.update({
      where: {
        id: id,
      },
      data: data,
    });

    return updatedUnit;
  } catch (error) {
    throw error;
  }
}

async function deleteUnit(id) {
  try {
    const deletedUnit = await prisma.units.delete({
      where: {
        id: id,
      },
    });

    return deletedUnit;
  } catch (error) {
    throw error;
  }
}

// Unit APIs
async function addDocType(data) {
  try {
    const newDocType = await prisma.doctypes.create({
      data,
    });

    return newDocType;
  } catch (error) {
    throw error;
  }
}

async function getAllDocTypes() {
  try {
    const allDocTypes = await prisma.doctypes.findMany();

    return allDocTypes;
  } catch (error) {
    throw error;
  }
}

async function getDocTypeById(unitId) {
  try {
    const docType = await prisma.doctypes.findUnique({ where: { id: unitId } });

    return docType;
  } catch (error) {
    throw error;
  }
}

async function updateDocType(id, data) {
  try {
    const updatedDocType = await prisma.doctypes.update({
      where: {
        id: id,
      },
      data: data,
    });

    return updatedDocType;
  } catch (error) {
    throw error;
  }
}

async function deleteDocType(id) {
  try {
    const deletedDocType = await prisma.doctypes.delete({
      where: {
        id: id,
      },
    });

    return deletedDocType;
  } catch (error) {
    throw error;
  }
}

// Feedback Criterias
async function addCriteria(data) {
  try {
    const newCriteria = await prisma.criterias.create({
      data,
    });

    return newCriteria;
  } catch (error) {
    throw error;
  }
}

async function getAllCriterias() {
  try {
    const allCriterias = await prisma.criterias.findMany();

    return allCriterias;
  } catch (error) {
    throw error;
  }
}

async function getCriteriaById(criteriaId) {
  try {
    const criteria = await prisma.criterias.findUnique({
      where: { id: criteriaId },
    });

    return criteria;
  } catch (error) {
    throw error;
  }
}

async function updateCriteria(criteriaId, data) {
  try {
    const updatedCriteria = await prisma.criterias.update({
      where: {
        id: criteriaId,
      },
      data: data,
    });

    return updatedCriteria;
  } catch (error) {
    throw error;
  }
}

async function deleteCriteria(criteriaId) {
  try {
    const deletedCriteria = await prisma.criterias.delete({
      where: {
        id: criteriaId,
      },
    });

    return deletedCriteria;
  } catch (error) {
    throw error;
  }
}

// Division
async function addDivision(data) {
  try {
    const newDivision = await prisma.divisions.create({
      data,
    });

    return newDivision;
  } catch (error) {
    throw error;
  }
}

async function getAllDivisions() {
  try {
    const allDivisions = await prisma.divisions.findMany();

    return allDivisions;
  } catch (error) {
    throw error;
  }
}
async function getDivisionById(divisionId) {
  try {
    const division = await prisma.divisions.findUnique({
      where: { id: divisionId },
    });

    return division;
  } catch (error) {
    throw error;
  }
}

async function updateDivision(divisionId, data) {
  try {
    const updatedDivision = await prisma.divisions.update({
      where: {
        id: divisionId,
      },
      data: data,
    });

    return updatedDivision;
  } catch (error) {
    throw error;
  }
}

async function deleteDivision(divisionId) {
  try {
    const deletedDivision = await prisma.divisions.delete({
      where: {
        id: divisionId,
      },
    });

    return deletedDivision;
  } catch (error) {
    throw error;
  }
}

// Systems
async function addSystem(data) {
  try {
    const newSystem = await prisma.systems.create({
      data,
    });

    return newSystem;
  } catch (error) {
    throw error;
  }
}

async function getAllSystems() {
  try {
    const allSystems = await prisma.systems.findMany();

    return allSystems;
  } catch (error) {
    throw error;
  }
}

async function getSystemById(systemId) {
  try {
    const system = await prisma.systems.findUnique({
      where: { id: systemId },
    });

    return system;
  } catch (error) {
    throw error;
  }
}

async function updateSystem(systemId, data) {
  try {
    const updatedSystem = await prisma.systems.update({
      where: {
        id: systemId,
      },
      data: data,
    });

    return updatedSystem;
  } catch (error) {
    throw error;
  }
}

async function deleteSystem(systemId) {
  try {
    const deletedSystem = await prisma.systems.delete({
      where: {
        id: systemId,
      },
    });

    return deletedSystem;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  getDestinations,

  addOffice,
  getAllOffices,
  getOfficeById,
  updateOffice,
  deleteOffice,

  addUnit,
  getAllUnits,
  getUnitById,
  updateUnit,
  deleteUnit,

  addDocType,
  getAllDocTypes,
  getDocTypeById,
  updateDocType,
  deleteDocType,

  addCriteria,
  getAllCriterias,
  getCriteriaById,
  updateCriteria,
  deleteCriteria,

  addDivision,
  getAllDivisions,
  getDivisionById,
  updateDivision,
  deleteDivision,

  addSystem,
  getAllSystems,
  getSystemById,
  updateSystem,
  deleteSystem,
};
