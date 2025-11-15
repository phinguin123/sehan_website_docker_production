from dao.level_dao import LevelDAO
from dao.grade_dao import GradeDAO
from dao.mode_dao import ModeDAO
from dao.subject_dao import SubjectDAO
from utils.db import DBHelper

db_helper = DBHelper()


class ReferenceService:
    def __init__(self):
        self.level_dao = LevelDAO(db_helper)
        self.grade_dao = GradeDAO(db_helper)
        self.mode_dao = ModeDAO(db_helper)
        self.subject_dao = SubjectDAO(db_helper)

    def get_reference_data(self):
        levels = self.level_dao.get_levels()
        grades = self.grade_dao.get_grades()
        modes = self.mode_dao.get_modes()
        subjects = self.subject_dao.get_subjects()
        return {
            "levels": levels,
            "grades": grades,
            "modes": modes,
            "subjects": subjects,
        }
