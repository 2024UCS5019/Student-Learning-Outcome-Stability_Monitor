const router = require("express").Router();
const ctrl = require("../controllers/attendanceController");
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");

router.post("/", auth, roles("Faculty", "Admin"), ctrl.recordAttendance);
router.get("/", auth, roles("Faculty", "Admin", "Student", "Viewer"), ctrl.getAttendance);
router.put("/:id", auth, roles("Faculty", "Admin"), ctrl.updateAttendance);
router.delete("/:id", auth, roles("Faculty", "Admin"), ctrl.deleteAttendance);

module.exports = router;
