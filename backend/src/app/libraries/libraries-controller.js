const express = require("express");
const librariesRouter = express.Router();
const librariesService = require("./libraries-service");

// Units and Offices
librariesRouter.get("/getDestinations", async (req, res) => {
  try {
    const fetchedDestinations = await librariesService.getDestinations();

    res.json(fetchedDestinations);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Office APIs
librariesRouter.post("/addOffice", async (req, res) => {
  try {
    const data = req.body;

    const createdOffice = await librariesService.addOffice(data);

    res.status(201).json(createdOffice);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal server error";

    res.status(statusCode).json({ error: errorMessage });
  }
});

librariesRouter.get("/getAllOffices", async (req, res) => {
  try {
    const fetchedOfficeData = await librariesService.getAllOffices();

    res.json(fetchedOfficeData);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal server error";

    res.status(statusCode).json({ error: errorMessage });
  }
});

librariesRouter.get("/getOfficeById/:id", async (req, res) => {
  try {
    const officeId = parseInt(req.params.id, 10);

    const fetchedOfficeData = await librariesService.getOfficeById(officeId);

    res.json(fetchedOfficeData);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal server error";

    res.status(statusCode).json({ error: errorMessage });
  }
});

librariesRouter.put("/updateOffice/:id", async (req, res) => {
  try {
    const officeId = parseInt(req.params.id, 10);

    const updatedOffice = await librariesService.updateOffice(
      officeId,
      req.body
    );

    res.json(updatedOffice);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal server error";

    res.status(statusCode).json({ error: errorMessage });
  }
});

librariesRouter.delete("/deleteOffice/:id", async (req, res) => {
  try {
    const officeId = parseInt(req.params.id, 10);

    const deletedOffice = await librariesService.deleteOffice(officeId);
    res.json(deletedOffice);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal server error";

    res.status(statusCode).json({ error: errorMessage });
  }
});

// Unit APIs
librariesRouter.post("/addUnit", async (req, res) => {
  try {
    const data = req.body;

    const createdUnit = await librariesService.addUnit(data);

    res.status(201).json(createdUnit);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

librariesRouter.get("/getAllUnits", async (req, res) => {
  try {
    const fetchedUnits = await librariesService.getAllUnits();

    res.json(fetchedUnits);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

librariesRouter.get("/getUnitById/:id", async (req, res) => {
  try {
    const unitId = parseInt(req.params.id, 10);

    const fetchedUnit = await librariesService.getUnitById(unitId);

    res.json(fetchedUnit);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

librariesRouter.put("/updateUnit/:id", async (req, res) => {
  try {
    const unitId = parseInt(req.params.id, 10);

    const updatedUnit = await librariesService.updateUnit(unitId, req.body);
    res.json(updatedUnit);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

librariesRouter.delete("/deleteUnit/:id", async (req, res) => {
  try {
    const unitId = parseInt(req.params.id, 10);

    const deletedUnit = await librariesService.deleteUnit(unitId);

    res.json(deletedUnit);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// DocType APIs
librariesRouter.post("/addDocType", async (req, res) => {
  try {
    const data = req.body;

    const createdDocType = await librariesService.addDocType(data);

    res.status(201).json(createdDocType);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

librariesRouter.get("/getAllDocTypes", async (req, res) => {
  try {
    const fetchedDocTypes = await librariesService.getAllDocTypes();

    res.json(fetchedDocTypes);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

librariesRouter.get("/getDocTypeById/:id", async (req, res) => {
  try {
    const docTypeId = parseInt(req.params.id, 10);

    const fetchedDocType = await librariesService.getDocTypeById(docTypeId);

    res.json(fetchedDocType);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

librariesRouter.put("/updateDocType/:id", async (req, res) => {
  try {
    const docTypeId = parseInt(req.params.id, 10);

    const updatedDocType = await librariesService.updateDocType(
      docTypeId,
      req.body
    );
    res.json(updatedDocType);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

librariesRouter.delete("/deleteDocType/:id", async (req, res) => {
  try {
    const docTypeId = parseInt(req.params.id, 10);

    const deletedDocType = await librariesService.deleteDocType(docTypeId);

    res.json(deletedDocType);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Feedback Criterias
librariesRouter.post("/addCriteria", async (req, res) => {
  try {
    const data = req.body;

    const createdCriteria = await librariesService.addCriteria(data);

    res.status(201).json(createdCriteria);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

librariesRouter.get("/getAllCriterias", async (req, res) => {
  try {
    const fetchedCriterias = await librariesService.getAllCriterias();

    res.json(fetchedCriterias);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

librariesRouter.get("/getCriteriaById/:id", async (req, res) => {
  try {
    const criteriaId = parseInt(req.params.id, 10);

    const fetchedCriteria = await librariesService.getCriteriaById(criteriaId);

    res.json(fetchedCriteria);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

librariesRouter.put("/updateCriteria/:id", async (req, res) => {
  try {
    const criteriaId = parseInt(req.params.id, 10);
    const data = req.body;

    const updatedCriteria = await librariesService.updateCriteria(
      criteriaId,
      data
    );
    res.json(updatedCriteria);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

librariesRouter.delete("/deleteCriteria/:id", async (req, res) => {
  try {
    const criteriaId = parseInt(req.params.id, 10);

    const deletedCriteria = await librariesService.deleteCriteria(criteriaId);

    res.json(deletedCriteria);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Division
librariesRouter.post("/addDivision", async (req, res) => {
  try {
    const data = req.body;

    const createdDivision = await librariesService.addDivision(data);

    res.status(201).json(createdDivision);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

librariesRouter.get("/getAllDivisions", async (req, res) => {
  try {
    const fetchedDivisions = await librariesService.getAllDivisions();

    res.json(fetchedDivisions);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

librariesRouter.get("/getDivisionById/:id", async (req, res) => {
  try {
    const divisionId = parseInt(req.params.id, 10);

    const fetchedDivision = await librariesService.getDivisionById(divisionId);

    res.json(fetchedDivision);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

librariesRouter.put("/updateDivision/:id", async (req, res) => {
  try {
    const divisionId = parseInt(req.params.id, 10);
    const data = req.body;

    const updatedDivision = await librariesService.updateDivision(
      divisionId,
      data
    );
    res.json(updatedDivision);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

librariesRouter.delete("/deleteDivision/:id", async (req, res) => {
  try {
    const divisionId = parseInt(req.params.id, 10);

    const deletedDivision = await librariesService.deleteDivision(divisionId);

    res.json(deletedDivision);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Division
librariesRouter.post("/addSystem", async (req, res) => {
  try {
    const data = req.body;

    const createdSystem = await librariesService.addSystem(data);

    res.status(201).json(createdSystem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

librariesRouter.get("/getAllSystems", async (req, res) => {
  try {
    const fetchedSystems = await librariesService.getAllSystems();

    res.json(fetchedSystems);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

librariesRouter.get("/getSystemById/:id", async (req, res) => {
  try {
    const systemId = parseInt(req.params.id, 10);

    const fetchedSystem = await librariesService.getSystemById(systemId);

    res.json(fetchedSystem);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

librariesRouter.put("/updateSystem/:id", async (req, res) => {
  try {
    const systemId = parseInt(req.params.id, 10);
    const data = req.body;

    const updatedSystem = await librariesService.updateSystem(systemId, data);
    res.json(updatedSystem);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

librariesRouter.delete("/deleteSystem/:id", async (req, res) => {
  try {
    const systemId = parseInt(req.params.id, 10);

    const deletedSystem = await librariesService.deleteSystem(systemId);

    res.json(deletedSystem);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = librariesRouter;
