const router = require("express").Router();
const ctrl = require("../controllers/reportController");
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");

router.get("/student/:studentId", auth, roles("Admin", "Faculty"), ctrl.studentReport);
router.get("/class", auth, roles("Admin"), ctrl.classReport);

module.exports = router;
