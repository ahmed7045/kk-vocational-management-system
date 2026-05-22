// import axios from "axios";

// const axiosInstance = axios.create({
//   baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
//   withCredentials: true,
// });

// axiosInstance.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem("accessToken");

//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }

//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// axiosInstance.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;

//     if (
//       error.response?.status === 401 &&
//       !originalRequest._retry &&
//       !originalRequest.url.includes("/auth/login")
//     ) {
//       originalRequest._retry = true;

//       try {
//         const refreshResponse = await axiosInstance.post("/auth/refresh");
//         const newAccessToken = refreshResponse.data.data.accessToken;

//         localStorage.setItem("accessToken", newAccessToken);

//         originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

//         return axiosInstance(originalRequest);
//       } catch (refreshError) {
//         localStorage.removeItem("accessToken");
//         localStorage.removeItem("user");
//         window.location.href = "/login";
//         return Promise.reject(refreshError);
//       }
//     }

//     return Promise.reject(error);
//   }
// );

// export default axiosInstance;

// DEMO MODE
import axios from "axios";

const isDemoMode = import.meta.env.VITE_DEMO_MODE === "true";

const demoResponse = (data) => {
  return Promise.resolve({
    data: {
      success: true,
      message: "Demo response",
      data,
    },
    status: 200,
    statusText: "OK",
    headers: {},
    config: {},
  });
};

const demoAdapter = async (config) => {
  const url = config.url || "";
  const method = (config.method || "get").toLowerCase();

  if (method !== "get") {
    return demoResponse({});
  }

  if (url.includes("/portal/portals")) {
    return demoResponse([
      {
        key: "vocational",
        name: "Vocational Training Center",
        description: "Manage students, courses, fees, employees and reports.",
      },
      {
        key: "welfare",
        name: "Welfare Management",
        description: "Manage donors, donations, charities and applications.",
      },
    ]);
  }

  if (url.includes("/portal/branches")) {
    return demoResponse([
      {
        id: 1,
        name: "Branch 1",
        location: "Main Campus",
        status: "active",
        total_students: 24,
        monthly_revenue: 120000,
      },
      {
        id: 2,
        name: "Branch 2",
        location: "Second Campus",
        status: "active",
        total_students: 18,
        monthly_revenue: 85000,
      },
      {
        id: 3,
        name: "Branch 3",
        location: "Third Campus",
        status: "active",
        total_students: 12,
        monthly_revenue: 60000,
      },
      {
        id: 4,
        name: "Branch 4",
        location: "Fourth Campus",
        status: "maintenance",
        total_students: 0,
        monthly_revenue: 0,
      },
    ]);
  }

  if (url.includes("/dashboard")) {
    return demoResponse({
      totalStudents: 54,
      paidStudents: 31,
      pendingStudents: 15,
      partialStudents: 8,
      totalRevenue: 265000,
      totalExpenses: 90000,
      balance: 175000,
      recentPayments: [],
      monthlyRevenue: [],
    });
  }

  if (url.includes("/students")) {
    return demoResponse([
      {
        id: 1,
        full_name: "Ahmed Ali",
        father_name: "Muhammad Ali",
        phone: "03001234567",
        branch_name: "Branch 1",
        courses: [{ courseName: "Web Development" }],
        total_fee: 15000,
        paid_fee: 5000,
        remaining_fee: 10000,
        fee_status: "partial",
        student_status: "active",
        admission_date: new Date().toISOString(),
      },
      {
        id: 2,
        full_name: "Sara Khan",
        father_name: "Imran Khan",
        phone: "03111234567",
        branch_name: "Branch 1",
        courses: [{ courseName: "Graphic Designing" }],
        total_fee: 12000,
        paid_fee: 0,
        remaining_fee: 12000,
        fee_status: "pending",
        student_status: "non_active",
        admission_date: new Date().toISOString(),
      },
    ]);
  }

  if (url.includes("/courses")) {
    return demoResponse([
      {
        id: 1,
        course_name: "Web Development",
        course_code: "WD-101",
        duration: "6 months",
        fee: 15000,
        description: "Frontend and backend development",
        is_active: true,
      },
    ]);
  }

  if (url.includes("/shifts")) {
    return demoResponse([
      {
        id: 1,
        shift_name: "Morning",
        start_time: "09:00",
        end_time: "12:00",
        is_active: true,
      },
    ]);
  }

  if (url.includes("/employees/permissions")) {
    return demoResponse([
      { id: 1, name: "students.view", description: "Can view students" },
      { id: 2, name: "students.create", description: "Can create students" },
      { id: 3, name: "payments.view", description: "Can view payments" },
    ]);
  }

  if (url.includes("/employees")) {
    return demoResponse([
      {
        id: 1,
        full_name: "Aftab Ahmed",
        designation: "Trainer",
        phone: "03000000000",
        salary: 30000,
        has_login_account: true,
        gender_visibility: "both",
        is_active: true,
      },
    ]);
  }

  if (url.includes("/payments/methods")) {
    return demoResponse([
      { id: 1, method_name: "Cash" },
      { id: 2, method_name: "Bank Transfer" },
      { id: 3, method_name: "EasyPaisa" },
      { id: 4, method_name: "JazzCash" },
    ]);
  }

  if (url.includes("/payments")) {
    return demoResponse([]);
  }

  if (url.includes("/expenses/categories")) {
    return demoResponse([
      { id: 1, category_name: "Rent" },
      { id: 2, category_name: "Salary" },
      { id: 3, category_name: "Electricity Bill" },
      { id: 4, category_name: "Maintenance" },
    ]);
  }

  if (url.includes("/expenses")) {
    return demoResponse([]);
  }

  if (url.includes("/welfare/dashboard")) {
    return demoResponse({
      totalDonations: 150000,
      totalWelfareExpenses: 50000,
      availableBalance: 100000,
      totalCases: 8,
      pendingCases: 3,
      approvedCases: 5,
      livesTouched: 25,
      activeGrants: 2,
    });
  }

  if (url.includes("/welfare/donors")) {
    return demoResponse([
      {
        id: 1,
        full_name: "Muhammad Ahmed",
        email: "donor@example.com",
        phone: "03001230000",
        address: "Karachi",
      },
    ]);
  }

  if (url.includes("/welfare/charities")) {
    return demoResponse([
      {
        id: 1,
        charity_name: "Education Support Program",
        charity_type: "Education",
        contact_person: "Ali",
        phone: "03004560000",
        is_active: true,
      },
    ]);
  }

  if (url.includes("/welfare/donation-methods")) {
    return demoResponse([
      { id: 1, method_name: "Cash" },
      { id: 2, method_name: "Bank Transfer" },
      { id: 3, method_name: "EasyPaisa" },
    ]);
  }

  if (url.includes("/welfare/donations")) {
    return demoResponse([
      {
        id: 1,
        donor_name: "Muhammad Ahmed",
        charity_name: "Education Support Program",
        amount: 50000,
        donation_method: "Cash",
        donation_date: new Date().toISOString(),
        purpose: "Education Support",
      },
    ]);
  }

  if (url.includes("/welfare/applications")) {
    return demoResponse([
      {
        id: 1,
        applicant_name: "Ayesha Bibi",
        phone: "03000001111",
        cnic: "42101-0000000-0",
        support_type: "Ration",
        requested_amount: 10000,
        approved_amount: 8000,
        case_status: "approved",
      },
    ]);
  }

  if (url.includes("/reports/welfare")) {
    return demoResponse({
      summary: {
        totalDonations: 150000,
        totalApprovedSupport: 50000,
        balanceAfterApprovedSupport: 100000,
        totalApplications: 8,
      },
      donations: [
        {
          donor_name: "Muhammad Ahmed",
          charity_name: "Education Support Program",
          amount: 50000,
          donation_date: new Date().toISOString(),
        },
      ],
      applications: [
        {
          applicant_name: "Ayesha Bibi",
          phone: "03000001111",
          support_type: "Ration",
          requested_amount: 10000,
          approved_amount: 8000,
          case_status: "approved",
        },
      ],
    });
  }

  if (url.includes("/reports/financial")) {
    return demoResponse({
      summary: {
        totalRevenue: 265000,
        totalExpenses: 90000,
        profit: 175000,
      },
      payments: [],
      expenses: [],
    });
  }

  if (url.includes("/reports/students")) {
    return demoResponse([]);
  }

  if (url.includes("/certificates")) {
    return demoResponse([]);
  }

  return demoResponse([]);
};

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
  adapter: isDemoMode ? demoAdapter : undefined,
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default axiosInstance;