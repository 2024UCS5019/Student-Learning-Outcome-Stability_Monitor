const router = require("express").Router();
const ctrl = require("../controllers/markController");
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");

router.post("/", auth, roles("Faculty", "Admin"), ctrl.createMark);
router.get("/", auth, roles("Faculty", "Admin", "Student", "Viewer"), ctrl.getMarks);
router.put("/:id", auth, roles("Faculty", "Admin"), ctrl.updateMark);
router.delete("/:id", auth, roles("Faculty", "Admin"), ctrl.deleteMark);

module.exports = router;
