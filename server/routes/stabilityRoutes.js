const router = require("express").Router();
const ctrl = require("../controllers/stabilityController");
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");

router.get("/", auth, roles("Admin", "Faculty", "Viewer"), ctrl.getStability);
router.post("/recalculate", auth, roles("Admin", "Faculty"), ctrl.recalculate);

module.exports = router;
