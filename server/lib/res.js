
export function successRes(res, statusCode, message, data = {}) {
    return res.status(statusCode).json({
        message,
        data,
        status: true,
    });
}

export function errorRes(res, statusCode, message, data = null) {
    const payload = {
        message,
        data: null,
        status: false,
    };
    return res.status(statusCode).json(payload);
}