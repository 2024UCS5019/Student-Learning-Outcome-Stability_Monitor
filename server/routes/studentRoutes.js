const router = require("express").Router();
const ctrl = require("../controllers/studentController");
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");

router.post("/", auth, roles("Admin", "Faculty"), ctrl.createStudent);
router.get("/", auth, roles("Admin", "Faculty", "Viewer"), ctrl.getStudents);
router.get("/me", auth, roles("Student"), ctrl.getCurrentStudent);
router.get("/me/dashboard", auth, roles("Student"), ctrl.getMyDashboard);
router.get("/:id", auth, roles("Admin", "Faculty", "Viewer"), ctrl.getStudentById);
router.get("/:id/dashboard", auth, roles("Admin", "Faculty", "Student", "Viewer"), ctrl.getStudentDashboard);
router.put("/:id", auth, roles("Admin", "Faculty"), ctrl.updateStudent);
router.patch("/:id/block", auth, roles("Admin", "Faculty"), ctrl.blockStudent);
router.patch("/:id/unblock", auth, roles("Admin", "Faculty"), ctrl.unblockStudent);
router.delete("/:id", auth, roles("Admin", "Faculty"), ctrl.deleteStudent);

module.exports = router;
