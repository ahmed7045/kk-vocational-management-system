const {
  loginUser,
  refreshAccessToken,
  logoutUser,
  getMe,
} = require("./auth.service");

const login = async (req, res, next) => {
  try {
    const { email, password, rememberDevice } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const result = await loginUser({
      email,
      password,
      deviceInfo: rememberDevice ? req.headers["user-agent"] : null,
      ipAddress: req.ip,
    });

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;

    const result = await refreshAccessToken(token);

    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;

    await logoutUser(token);

    res.clearCookie("refreshToken");

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    next(error);
  }
};

const me = async (req, res, next) => {
  try {
    const user = await getMe(req.user.id);

    res.status(200).json({
      success: true,
      message: "User fetched successfully",
      data: {
        user: {
          ...user,
          permissions: req.user.permissions,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  refresh,
  logout,
  me,
};