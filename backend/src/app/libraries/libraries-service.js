const librariesDao = require("./libraries-dao");

// Units and Offices
async function getDestinations() {
  try {
    const fetchedDestinations = await librariesDao.getDestinations();

    return fetchedDestinations;
  } catch (error) {
    console.error("Error!", error);
    throw new Error("Error in Process");
  }
}

// Office APIs
async function addOffice(data) {
  try {
    const createdOffice = await librariesDao.addOffice(data);

    return createdOffice;
  } catch (error) {
    throw error;
  }
}

async function getAllOffices() {
  try {
    const fetchedOffices = await librariesDao.getAllOffices();

    return fetchedOffices;
  } catch (error) {
    console.error("Error!", error);
    throw new Error("Error in Process");
  }
}

async function getOfficeById(officeId) {
  try {
    const fetchedOffice = await librariesDao.getOfficeById(officeId);

    return fetchedOffice;
  } catch (error) {
    console.error("Error!", error);
    throw new Error("Error in Process");
  }
}

async function updateOffice(id, data) {
  try {
    const updatedOffice = await librariesDao.updateOffice(id, data);

    return updatedOffice;
  } catch (error) {
    console.error("Error!", error);
    throw new Error("Error in Process");
  }
}

async function deleteOffice(id) {
  try {
    const deletedOffice = await librariesDao.deleteOffice(id);

    return deletedOffice;
  } catch (error) {
    console.error("Error!", error);
    throw new Error("Error in Process");
  }
}

// Unit APIs
async function addUnit(data) {
  try {
    const createdUnit = await librariesDao.addUnit(data);

    return createdUnit;
  } catch (error) {
    throw error;
  }
}

async function getAllUnits() {
  try {
    const fetchedUnits = await librariesDao.getAllUnits();

    return fetchedUnits;
  } catch (error) {
    console.error("Error!", error);
    throw new Error("Error in Process");
  }
}

async function getUnitById(unitId) {
  try {
    const fetchedUnit = await librariesDao.getUnitById(unitId);

    return fetchedUnit;
  } catch (error) {
    console.error("Error!", error);
    throw new Error("Error in Process");
  }
}

async function updateUnit(id, data) {
  try {
    const updatedUnit = await librariesDao.updateUnit(id, data);

    return updatedUnit;
  } catch (error) {
    console.error("Error!", error);
    throw new Error("Error in Process");
  }
}

async function deleteUnit(id) {
  try {
    const deletedUnit = await librariesDao.deleteUnit(id);

    return deletedUnit;
  } catch (error) {
    console.error("Error!", error);
    throw new Error("Error in Process");
  }
}

// DocType APIs
async function addDocType(data) {
  try {
    const createdDocType = await librariesDao.addDocType(data);

    return createdDocType;
  } catch (error) {
    throw error;
  }
}

async function getAllDocTypes() {
  try {
    const fetchedDocTypes = await librariesDao.getAllDocTypes();

    return fetchedDocTypes;
  } catch (error) {
    console.error("Error!", error);
    throw new Error("Error in Process");
  }
}

async function getDocTypeById(unitId) {
  try {
    const fetchedDocType = await librariesDao.getDocTypeById(unitId);

    return fetchedDocType;
  } catch (error) {
    console.error("Error!", error);
    throw new Error("Error in Process");
  }
}

async function updateDocType(id, data) {
  try {
    const updatedDocType = await librariesDao.updateDocType(id, data);

    return updatedDocType;
  } catch (error) {
    console.error("Error!", error);
    throw new Error("Error in Process");
  }
}

async function deleteDocType(id) {
  try {
    const deletedDocType = await librariesDao.deleteDocType(id);

    return deletedDocType;
  } catch (error) {
    console.error("Error!", error);
    throw new Error("Error in Process");
  }
}

// Feedback Criterias
async function addCriteria(data) {
  try {
    const createdCriteria = await librariesDao.addCriteria(data);

    return createdCriteria;
  } catch (error) {
    throw error;
  }
}

async function getAllCriterias() {
  try {
    const fetchedCriterias = await librariesDao.getAllCriterias();

    return fetchedCriterias;
  } catch (error) {
    console.error("Error!", error);
    throw new Error("Error in Process");
  }
}

async function getCriteriaById(criteriaId) {
  try {
    const fetchedCriteria = await librariesDao.getCriteriaById(criteriaId);

    return fetchedCriteria;
  } catch (error) {
    console.error("Error!", error);
    throw new Error("Error in Process");
  }
}

async function updateCriteria(criteriaId, data) {
  try {
    const updatedCriteria = await librariesDao.updateCriteria(criteriaId, data);

    return updatedCriteria;
  } catch (error) {
    console.error("Error!", error);
    throw new Error("Error in Process");
  }
}

async function deleteCriteria(criteriaId) {
  try {
    const deletedCriteria = await librariesDao.deleteCriteria(criteriaId);

    return deletedCriteria;
  } catch (error) {
    console.error("Error!", error);
    throw new Error("Error in Process");
  }
}

// Feedback Criterias
async function addDivision(data) {
  try {
    const createdDivision = await librariesDao.addDivision(data);

    return createdDivision;
  } catch (error) {
    throw error;
  }
}

async function getAllDivisions() {
  try {
    const fetchedDivisions = await librariesDao.getAllDivisions();

    return fetchedDivisions;
  } catch (error) {
    console.error("Error!", error);
    throw new Error("Error in Process");
  }
}

async function getDivisionById(divisionId) {
  try {
    const fetchedDivision = await librariesDao.getDivisionById(divisionId);

    return fetchedDivision;
  } catch (error) {
    console.error("Error!", error);
    throw new Error("Error in Process");
  }
}

async function updateDivision(divisionId, data) {
  try {
    const updatedDivision = await librariesDao.updateDivision(divisionId, data);

    return updatedDivision;
  } catch (error) {
    console.error("Error!", error);
    throw new Error("Error in Process");
  }
}

async function deleteDivision(divisionId) {
  try {
    const deletedDivision = await librariesDao.deleteDivision(divisionId);

    return deletedDivision;
  } catch (error) {
    console.error("Error!", error);
    throw new Error("Error in Process");
  }
}

// Systems
async function addSystem(data) {
  try {
    const createdSystem = await librariesDao.addSystem(data);

    return createdSystem;
  } catch (error) {
    throw error;
  }
}

async function getAllSystems() {
  try {
    const fetchedSystems = await librariesDao.getAllSystems();

    return fetchedSystems;
  } catch (error) {
    console.error("Error!", error);
    throw new Error("Error in Process");
  }
}

async function getSystemById(systemId) {
  try {
    const fetchedSystem = await librariesDao.getSystemById(systemId);

    return fetchedSystem;
  } catch (error) {
    console.error("Error!", error);
    throw new Error("Error in Process");
  }
}

async function updateSystem(systemId, data) {
  try {
    const updatedSystem = await librariesDao.updateSystem(systemId, data);

    return updatedSystem;
  } catch (error) {
    console.error("Error!", error);
    throw new Error("Error in Process");
  }
}

async function deleteSystem(systemId) {
  try {
    const deletedSystem = await librariesDao.deleteSystem(systemId);

    return deletedSystem;
  } catch (error) {
    console.error("Error!", error);
    throw new Error("Error in Process");
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
