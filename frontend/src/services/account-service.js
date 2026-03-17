/* eslint-disable prettier/prettier */
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';
// const BASE_URL = "http://localhost:9000";
// const BASE_URL = "https://smea.depedimuscity.com:8020";
// const BASE_URL = "https://lesspaper.depedimuscity.com:8000";

function authenticate(account) {
  return axios
    .post(`${BASE_URL}/user/login`, account, {
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true
    })
    .then(res => {
      const { accessToken } = res.data.data;

      axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

      return res.data;
    });
}

function logout() {
  return axios
    .post(
      `${BASE_URL}/user/logout`,
      {},
      {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true
      }
    )
    .then(res => res.data);
}

function refresh() {
  return axios
    .post(
      `${BASE_URL}/user/refresh`,
      {},
      {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true
      }
    )
    .then(res => {
      const { accessToken } = res.data;

      axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

      return res.data;
    });
}

function register(newAccount) {
  return axios.post(`${BASE_URL}/user/register`, newAccount).then(res => res.data);
}

function getUserById(uid) {
  return axios.get(`${BASE_URL}/user/getUser/${uid}`).then(res => res.data);
}

function getAllUsers() {
  return axios.get(`${BASE_URL}/user/getAllUsers`).then(res => res.data);
}

function updateUser(id, data) {
  return axios.put(`${BASE_URL}/user/update/${id}`, data).then(res => res.data);
}

function deleteUser(id, data) {
  return axios.delete(`${BASE_URL}/user/delete/${id}`, data).then(res => res.data);
}

export default {
  authenticate,
  logout,
  refresh,
  register,
  getUserById,
  getAllUsers,
  updateUser,
  deleteUser
};
