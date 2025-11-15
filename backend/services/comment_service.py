from utils.db import DBHelper
from dao.comment_dao import CommentDAO
from utils.utils import check_user_admin

db_helper = DBHelper()

class NotAdminException(Exception):
    pass

class CommentService:
    def __init__(self):
        self.comment_dao = CommentDAO(db_helper)

    def delete_all_comments(self, teacher_id):
        # check if the user has permission to delete comments
        if not check_user_admin(teacher_id):
            raise NotAdminException("You are not admin!")
        
        return self.comment_dao.delete_all_comments()