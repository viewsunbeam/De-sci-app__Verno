const express = require("express");
const axios = require("axios");
const { getChainApiBaseUrl } = require("../config/blockchain");

const router = express.Router();

const CHAIN_API_BASE = getChainApiBaseUrl().replace(/\/+$/, "");

async function forwardRequest(req, res, method, targetPath, data) {
  try {
    const url = `${CHAIN_API_BASE}${targetPath}`;
    const response = await axios({
      method,
      url,
      params: method === "get" ? req.query : undefined,
      data,
      timeout: 10000,
    });
    res.json(response.data);
  } catch (error) {
    const status = error.response ? error.response.status : 502;
    const message =
      (error.response && error.response.data) ||
      { error: "Chain API request failed" };
    console.error(
      `Chain API proxy error [${method.toUpperCase()} ${targetPath}]:`,
      error.message
    );
    res.status(status).json(message);
  }
}

router.get("/health", async (req, res) =>
  forwardRequest(req, res, "get", "/health")
);

router.get("/research/latest", async (req, res) =>
  forwardRequest(req, res, "get", "/api/research/latest")
);

router.get("/research/:id", async (req, res) =>
  forwardRequest(req, res, "get", `/api/research/${req.params.id}`)
);

router.get("/research/by-author/:address", async (req, res) =>
  forwardRequest(req, res, "get", `/api/research/by-author/${req.params.address}`)
);

router.post("/research/:id/verify", async (req, res) =>
  forwardRequest(req, res, "post", `/api/research/${req.params.id}/verify`, req.body)
);

router.get("/dataset/:datasetId", async (req, res) =>
  forwardRequest(
    req,
    res,
    "get",
    `/api/dataset/${req.params.datasetId}`
  )
);

module.exports = router;
