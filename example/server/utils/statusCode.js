const ERRNO = {
  ERRNO_RESPONSE_SUCCESS: 0,


  // =========================================================================
  // 其他异常
  // =========================================================================

  // 获取用户登录态失败
  ERRNO_USER_NOT_LOGIN: 20001,

  // =========================================================================
  // 传入参数异常
  // =========================================================================

  // 传json参数，解析异常
  ERRNO_PARAMS_JSON_ERROR: 30001,

  // 缺少必要参数
  ERRNO_PARAMS_ERROR: 30002,


  // =========================================================================
  // 响应异常
  // =========================================================================

  // 返回responsePo为空
  ERRNO_RESPONSE_EMPTY: 40001,

  // 返回responsePo的data为空
  ERRNO_RESPONSE_DATA_EMPTY: 40002,

  // 返回的数据解析json异常
  ERRNO_RESPONSE_DATA_PARSE_ERROR: 40003,

  // 未知错误码
  ERRNO_RESPONSE_UNKNOW_ERROR: 40004,


  // =========================================================================
  // 响应HTTP状态码
  // =========================================================================

  // 无内容
  ERRNO_HTTP_NO_CONTENT: 50204,

  // 响应参数错误
  ERRNO_HTTP_PARAM_ERROR: 50400,

  // 未授权
  ERRNO_HTTP_UNAUTHORIZED: 50401,

  // 无权限访问
  ERRNO_HTTP_FORBIDDEN: 50403,

  // 无此资源
  ERRNO_HTTP_EMPTY_RESOURCE: 50404,

  // 方法不允许
  ERRNO_HTTP_METHOD_NOT_ALLOW: 50405,

  // 超时
  ERRNO_HTTP_TIMEOUT: 50408,

  // 冲突，一般用于判重
  ERRNO_HTTP_CONFLICT: 50409,


  // 服务器异常，响应500
  ERRNO_HTTP_SERVER_ERROR: 50500,

  // 网关错误
  ERRNO_HTTP_BAD_GATE_WAY: 50502,

  // 服务器暂无法访问
  ERRNO_HTTP_SERVICE_UNAVAILABLE: 50503,


  // =========================================================================
  // 操作类接口异常
  // =========================================================================

  // 操作失败，出现异常，-1
  ERRNO_OPERATION_ERROR: 60001,

  // 操作无权限，-2
  ERRNO_OPERATION_NO_RIGHT: 60002,

  // 操作参数错误，-3
  ERRNO_OPERATION_PARAM_ERROR: 60003,

  // 操作失败，无操作资源，-4
  ERRNO_OPERATION_NO_RESOURCE: 60004,

  // 启动构建失败，构建中或队列中，2
  ERRNO_OPERATION_START_BUILD_FAIL: 60005,

  // 批量操作，部分成功
  ERRNO_OPERATION_NOT_ALL_SUCCESS: 60006,

  // =========================================================================
  // 一些业务异常
  // =========================================================================
};

function normalizeStatusCode(statusCode) {
  var errno = -1;

  switch (statusCode) {
    // 20001
    case ERRNO.ERRNO_USER_NOT_LOGIN:
      errno = ERRNO.ERRNO_USER_NOT_LOGIN;
      break;

    // 30001
    case ERRNO.ERRNO_PARAMS_JSON_ERROR:
      errno = ERRNO.ERRNO_PARAMS_JSON_ERROR;
      break;
    // 30002
    case ERRNO.ERRNO_PARAMS_ERROR:
      errno = ERRNO.ERRNO_PARAMS_ERROR;
      break;
    // 40001
    case ERRNO.ERRNO_RESPONSE_EMPTY:
      errno = ERRNO.ERRNO_RESPONSE_EMPTY;
      break;
    // 40002
    case ERRNO.ERRNO_RESPONSE_DATA_EMPTY:
      errno = ERRNO.ERRNO_RESPONSE_DATA_EMPTY;
      break;
    // 40003
    case ERRNO.ERRNO_RESPONSE_DATA_PARSE_ERROR:
      errno = ERRNO.ERRNO_RESPONSE_DATA_PARSE_ERROR;
      break;
    // 0
    case 0:
    case 200:
      errno = ERRNO.ERRNO_RESPONSE_SUCCESS;
      break;
    // 50204
    case 204:
    case ERRNO.ERRNO_HTTP_NO_CONTENT:
      errno = ERRNO.ERRNO_HTTP_NO_CONTENT;
      break;
    // 50400
    case 400:
    case ERRNO.ERRNO_HTTP_PARAM_ERROR:
      errno = ERRNO.ERRNO_HTTP_PARAM_ERROR;
      break;
    // 50401
    case 401:
    case ERRNO.ERRNO_HTTP_UNAUTHORIZED:
      errno = ERRNO.ERRNO_HTTP_UNAUTHORIZED;
      break;
    // 50403
    case 403:
    case ERRNO.ERRNO_HTTP_FORBIDDEN:
      errno = ERRNO.ERRNO_HTTP_FORBIDDEN;
      break;
    // 50404
    case 404:
    case ERRNO.ERRNO_HTTP_EMPTY_RESOURCE:
      errno = ERRNO.ERRNO_HTTP_EMPTY_RESOURCE;
      break;
    // 50405
    case 405:
    case ERRNO.ERRNO_HTTP_METHOD_NOT_ALLOW:
      errno = ERRNO.ERRNO_HTTP_METHOD_NOT_ALLOW;
      break;
    // 50408
    case 408:
    case ERRNO.ERRNO_HTTP_TIMEOUT:
      errno = ERRNO.ERRNO_HTTP_TIMEOUT;
      break;
    // 50409
    case 409:
    case ERRNO.ERRNO_HTTP_CONFLICT:
      errno = ERRNO.ERRNO_HTTP_CONFLICT;
      break;
    // 50500
    case 500:
    case ERRNO.ERRNO_HTTP_SERVER_ERROR:
      errno = ERRNO.ERRNO_HTTP_SERVER_ERROR;
      break;
    // 50502
    case 502:
    case ERRNO.ERRNO_HTTP_BAD_GATE_WAY:
      errno = ERRNO.ERRNO_HTTP_BAD_GATE_WAY;
      break;
    // 50503
    case 503:
    case ERRNO.ERRNO_HTTP_SERVICE_UNAVAILABLE:
      errno = ERRNO.ERRNO_HTTP_SERVICE_UNAVAILABLE;
      break;

    // 60001
    case -1:
    case ERRNO.ERRNO_OPERATION_ERROR:
      errno = ERRNO.ERRNO_OPERATION_ERROR;
      break;
    // 60002
    case -2:
    case ERRNO.ERRNO_OPERATION_NO_RIGHT:
      errno = ERRNO.ERRNO_OPERATION_NO_RIGHT;
      break;
    // 60003
    case -3:
    case ERRNO.ERRNO_OPERATION_PARAM_ERROR:
      errno = ERRNO.ERRNO_OPERATION_PARAM_ERROR;
      break;
    // 60004
    case -4:
    case ERRNO.ERRNO_OPERATION_NO_RESOURCE:
      errno = ERRNO.ERRNO_OPERATION_NO_RESOURCE;
      break;
    // 60005
    case 2:
    case ERRNO.ERRNO_OPERATION_START_BUILD_FAIL:
      errno = ERRNO.ERRNO_OPERATION_START_BUILD_FAIL;
      break;
    // 60006
    case ERRNO.ERRNO_OPERATION_NOT_ALL_SUCCESS:
      errno = ERRNO.ERRNO_OPERATION_NOT_ALL_SUCCESS;
      break;

    // 40004
    case ERRNO.ERRNO_RESPONSE_UNKNOW_ERROR:
    default:
      errno = ERRNO.ERRNO_RESPONSE_UNKNOW_ERROR;
      break;
  }

  return errno;
}

function get(statusName) {
  return ERRNO[statusName] === undefined ? -1 : ERRNO[statusName];
}

module.exports = {
  errno: ERRNO,
  normalizeStatusCode: normalizeStatusCode
};