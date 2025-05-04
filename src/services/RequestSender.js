import axios from "axios";

const apiBase = '/api';

const getHeaders = (jwt, headers, params, body) => {
    const isFormData = body instanceof FormData;
    return {
        ...(params ?
                {
                    params: {
                        ...params
                    }
                }
                : {}
        ),
        headers: {
            'Content-Type': (isFormData ? 'multipart/form-data' : 'application/json'),
            ...(jwt ? ({'Authorization': `Bearer ${jwt}`}) : {}),
            ...headers,
        }
    }
}

export const sendGet = async (uri, jwt, headers = {}, params = {}) => {
    return await axios.get(`${apiBase}${uri}`, getHeaders(jwt, headers, params, {}));
}

export const sendPost = async (uri, jwt, headers = {}, body = {}, params = {}) => {
    return await axios.post(`${apiBase}${uri}`, body, getHeaders(jwt, headers, params, body));
}

export const sendPut = async (uri, jwt, headers = {}, body = {}, params = {}) => {
    return await axios.put(`${apiBase}${uri}`, body, getHeaders(jwt, headers, params, body));
}

export const sendDelete = async (uri, jwt, headers = {}, params = {}) => {
    return await axios.delete(`${apiBase}${uri}`, getHeaders(jwt, headers, params, {}));
}

export const sendPatch = async (uri, jwt, headers = {}, body = {}, params = {}) => {
    return await axios.patch(`${apiBase}${uri}`, body, getHeaders(jwt, headers, params, body));
}

