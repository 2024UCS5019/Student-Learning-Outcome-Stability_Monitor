const router = require("express").Router();
const ctrl = require("../controllers/studentController");
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");

router.post("/", auth, roles("Admin"), ctrl.createStudent);
router.get("/", auth, roles("Admin", "Faculty"), ctrl.getStudents);
router.get("/:id", auth, roles("Admin", "Faculty"), ctrl.getStudentById);
router.get("/:id/dashboard", auth, roles("Admin", "Faculty"), ctrl.getStudentDashboard);
router.put("/:id", auth, roles("Admin"), ctrl.updateStudent);
router.delete("/:id", auth, roles("Admin"), ctrl.deleteStudent);

module.exports = router;
