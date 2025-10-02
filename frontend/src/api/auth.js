import api from "./axios";

export const registerUser = async (data) => {
  try {
    const res = await api.post("/register", data);
    return res.data;
  } catch (error) {
    console.error("Register error:", error.response?.data || error.message);
    throw error;
  }
};

export const loginUser = async (data) => {
  try {
    const res = await api.post("/login", data);
    const { token, user } = res.data;
    // simpan token ke localStorage
    localStorage.setItem("token", token);
    return user;
  } catch (error) {
    console.error("Login error:", error.response?.data || error.message);
    throw error;
  }
};

export const logoutUser = () => {
  localStorage.removeItem("token");
};
