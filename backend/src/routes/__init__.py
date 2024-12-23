from flask import Blueprint

# 创建一个蓝图用于路由
routes = Blueprint('routes', __name__)

# 导入路由
from . import auth, chat
