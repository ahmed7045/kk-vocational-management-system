import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import {
  HeartHandshake,
  Users,
  Wallet,
  FileCheck,
  Plus,
  // RefreshCcw,
  CheckCircle,
  XCircle,
  ChevronDown,
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

import axiosInstance from "../api/axiosInstance";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Select from "../components/common/Select";
import Table from "../components/common/Table";
import Badge from "../components/common/Badge";
import Modal from "../components/common/Modal";
import Loader from "../components/common/Loader";
import ActionButtons from "../components/common/ActionButtons";
import ConfirmDeleteModal from "../components/common/ConfirmDeleteModal";
import DateRangePicker from "../components/common/DateRangePicker";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { formatCurrency, formatDate } from "../utils/formatters";

import "./welfare.css";

const isDemoMode = import.meta.env.VITE_DEMO_MODE === "true";

const getTodayDate = () => new Date().toISOString().split("T")[0];

const WelfareDashboard = ({ defaultTab = "dashboard" }) => {
  const { user } = useAuth();

  const todayText = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(defaultTab);

  const [dashboard, setDashboard] = useState(null);
  const [donors, setDonors] = useState([]);
  const [charities, setCharities] = useState([]);
  const [charityRecords, setCharityRecords] = useState([]);
  const [donations, setDonations] = useState([]);
  const [applications, setApplications] = useState([]);
  const [donationMethods, setDonationMethods] = useState([]);

  const navigate = useNavigate();
  const location = useLocation();

  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [donorModalOpen, setDonorModalOpen] = useState(false);
  const [donorViewModalOpen, setDonorViewModalOpen] = useState(false);
  const [donorDeleteModalOpen, setDonorDeleteModalOpen] = useState(false);

  const [charityModalOpen, setCharityModalOpen] = useState(false);
  const [charityViewModalOpen, setCharityViewModalOpen] = useState(false);
  const [charityDeleteModalOpen, setCharityDeleteModalOpen] = useState(false);

  const [donationModalOpen, setDonationModalOpen] = useState(false);
  const [donationViewModalOpen, setDonationViewModalOpen] = useState(false);
  const [donationDeleteModalOpen, setDonationDeleteModalOpen] = useState(false);

  const [applicationModalOpen, setApplicationModalOpen] = useState(false);
  const [applicationViewModalOpen, setApplicationViewModalOpen] = useState(false);
  const [applicationDeleteModalOpen, setApplicationDeleteModalOpen] = useState(false);

  const [statusModalOpen, setStatusModalOpen] = useState(false);

  const [selectedDonor, setSelectedDonor] = useState(null);
  const [selectedDonorDonations, setSelectedDonorDonations] = useState([]);
  const [donorDonationModalOpen, setDonorDonationModalOpen] = useState(false);
  const [selectedCharity, setSelectedCharity] = useState(null);
  const [selectedCharityHistory, setSelectedCharityHistory] = useState([]);
  const [charityRecordModalOpen, setCharityRecordModalOpen] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    donorSearch: "",

    beneficiarySearch: "",

    charityRecordSearch: "",
    charityRecordFromDate: "",
    charityRecordToDate: "",

    donationSearch: "",
    donationMethodId: "",
    donationFromDate: "",
    donationToDate: "",

    applicationSearch: "",
    applicationStatus: searchParams.get("caseStatus") || "",
    // applicationSupportType: "",
  });

  useEffect(() => {
    const urlCaseStatus = searchParams.get("caseStatus") || "";

    setFilters((prev) => {
      if (prev.applicationStatus === urlCaseStatus) return prev;

      return {
        ...prev,
        applicationStatus: urlCaseStatus,
      };
    });
  }, [searchParams]);

  const [donorForm, setDonorForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
  });

  const [donationForm, setDonationForm] = useState({
    donorId: "",
    name: "",
    contact: "",
    amount: "",
    methodId: "",
    date: getTodayDate(),
  });

  const [charityForm, setCharityForm] = useState({
    charityName: "",
    fatherName: "",
    contactPerson: "",
    phone: "",
    cnic: "",
    address: "",
    familyMembers: "",
    monthlyIncome: "",
    description: "",

    charityType: "",
    amount: "",
    itemName: "",
    quantity: "",
    charityDate: "",
    recordNote: "",
  });

  const [charityRecordForm, setCharityRecordForm] = useState({
    charityType: "",
    amount: "",
    itemName: "",
    quantity: "",
    charityDate: "",
    note: "",
  });


  const [donorDonationForm, setDonorDonationForm] = useState({
    amount: "",
    methodId: "",
    date: "",
  });

  const [applicationForm, setApplicationForm] = useState({
    applicantName: "",
    fatherName: "",
    phone: "",
    cnic: "",
    gender: "",
    maritalStatus: "",
    familyMembers: "",
    monthlyIncome: "",
    monthlyExpense: "",
    requestedAmount: "",
    address: "",
    verificationNotes: "",
  });

  const [statusForm, setStatusForm] = useState({
    caseStatus: "approved",
    approvedAmount: "",
    verificationNotes: "",
  });

  const fetchWelfareData = async () => {
    try {
      setLoading(true);
      setError("");

      if (activeTab === "dashboard") {
        const [dashboardRes, donationsRes, applicationsRes] = await Promise.all([
          axiosInstance.get("/welfare/dashboard"),
          axiosInstance.get("/welfare/donations?page=1&limit=100"),
          axiosInstance.get("/welfare/applications?page=1&limit=100"),
        ]);

        setDashboard(dashboardRes.data.data);
        setDonations(donationsRes.data.data || []);
        setApplications(applicationsRes.data.data || []);
      }

      if (activeTab === "donors") {
        const donorQuery = buildQuery({
          page: 1,
          limit: 100,
          search: filters.donorSearch,
        });

        const [donorsRes, methodsRes] = await Promise.all([
          axiosInstance.get(`/welfare/donors?${donorQuery}`),
          axiosInstance.get("/welfare/donation-methods"),
        ]);

        setDonors(donorsRes.data.data || []);
        setDonationMethods(methodsRes.data.data || []);
      }

      if (activeTab === "charities") {
        const beneficiaryQuery = buildQuery({
          page: 1,
          limit: 100,
          search: filters.beneficiarySearch,
        });

        const charitiesRes = await axiosInstance.get(
          `/welfare/charities?${beneficiaryQuery}`
        );

        setCharities(charitiesRes.data.data || []);
      }

      if (activeTab === "charityRecords") {
        const recordQuery = buildQuery({
          page: 1,
          limit: 100,
          search: filters.charityRecordSearch,
          fromDate: filters.charityRecordFromDate,
          toDate: filters.charityRecordToDate,
        });

        const recordsRes = await axiosInstance.get(
          `/welfare/charity-records?${recordQuery}`
        );

        setCharityRecords(recordsRes.data.data || []);
      }

      if (activeTab === "donations") {
        const donationQuery = buildQuery({
          page: 1,
          limit: 100,
          search: filters.donationSearch,
          methodId: filters.donationMethodId,
          fromDate: filters.donationFromDate,
          toDate: filters.donationToDate,
        });

        const [donationsRes, donorsRes, charitiesRes, methodsRes] =
          await Promise.all([
            axiosInstance.get(`/welfare/donations?${donationQuery}`),
            axiosInstance.get("/welfare/donors?page=1&limit=100"),
            axiosInstance.get("/welfare/charities?page=1&limit=100"),
            axiosInstance.get("/welfare/donation-methods"),
          ]);

        setDonations(donationsRes.data.data || []);
        setDonors(donorsRes.data.data || []);
        setCharities(charitiesRes.data.data || []);
        setDonationMethods(methodsRes.data.data || []);
      }

      if (activeTab === "applications") {
        const applicationQuery = buildQuery({
          page: 1,
          limit: 100,
          search: filters.applicationSearch,
          caseStatus: filters.applicationStatus,
          // supportType: filters.applicationSupportType,
        });

        const applicationsRes = await axiosInstance.get(
          `/welfare/applications?${applicationQuery}`
        );

        setApplications(applicationsRes.data.data || []);
      }
    } catch (error) {
      setError(error.response?.data?.message || "Failed to fetch welfare data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    const openModal = location.state?.openModal;

    if (!openModal) return;

    if (openModal === "donation" && defaultTab === "donations") {
      // setDonationModalOpen(true);
      openAddDonationModal();
    }

    if (openModal === "charity" && defaultTab === "charities") {
      openAddCharityModal();
    }

    if (openModal === "application" && defaultTab === "applications") {
      openAddApplicationModal();
    }

    window.history.replaceState({}, document.title);
  }, [location.state, defaultTab]);

  useEffect(() => {
    fetchWelfareData();
  }, [activeTab, filters]);

  const handleChange = (setter) => (event) => {
    const { name, value, type, checked } = event.target;

    setter((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "applicationStatus") {
      const params = new URLSearchParams(searchParams);

      if (value) {
        params.set("caseStatus", value);
      } else {
        params.delete("caseStatus");
      }

      setSearchParams(params);
    }
  };

  const buildQuery = (params) => {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        query.append(key, value);
      }
    });

    return query.toString();
  };

  const resetDonationForm = () => {
    setDonationForm({
      donorId: "",
      name: "",
      contact: "",
      amount: "",
      methodId: "",
      date: getTodayDate(),
    });
  };

  const openAddDonationModal = async () => {
    setSelectedDonation(null);
    resetDonationForm();

    try {
      const [donorsRes, methodsRes] = await Promise.all([
        axiosInstance.get("/welfare/donors?page=1&limit=100"),
        axiosInstance.get("/welfare/donation-methods"),
      ]);

      setDonors(donorsRes.data.data || []);
      setDonationMethods(methodsRes.data.data || []);
    } catch (error) {
      console.error("Donation form data error:", error.response?.data?.message);
    }

    setDonationModalOpen(true);
  };

  const handleDonationNameChange = (event) => {
    const name = event.target.value;

    const selectedDonor = donors.find(
      (donor) => donor.full_name?.toLowerCase() === name.toLowerCase()
    );

    setDonationForm((prev) => ({
      ...prev,
      donorId: selectedDonor?.id || "",
      name,
      contact: selectedDonor?.phone || "",
      date: getTodayDate(),
    }));
  };

  const resetDonorForm = () => {
    setDonorForm({
      fullName: "",
      phone: "",
      email: "",
      address: "",
    });
  };

  const openAddDonorModal = () => {
    setSelectedDonor(null);
    resetDonorForm();
    setDonorModalOpen(true);
  };

  const saveDonor = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);

      if (selectedDonor?.id) {
        if (!isDemoMode) {
          await axiosInstance.put(
            `/welfare/donors/${selectedDonor.id}`,
            donorForm
          );
          fetchWelfareData();
        } else {
          setDonors((prev) =>
            prev.map((donor) =>
              donor.id === selectedDonor.id
                ? {
                  ...donor,
                  full_name: donorForm.fullName,
                  phone: donorForm.phone,
                  email: donorForm.email,
                  address: donorForm.address,
                }
                : donor
            )
          );
        }
      } else {
        if (!isDemoMode) {
          await axiosInstance.post("/welfare/donors", donorForm);
          fetchWelfareData();
        } else {
          setDonors((prev) => [
            {
              id: Date.now(),
              full_name: donorForm.fullName,
              phone: donorForm.phone,
              email: donorForm.email,
              address: donorForm.address,
            },
            ...prev,
          ]);
        }
      }

      setDonorModalOpen(false);
      setSelectedDonor(null);
      resetDonorForm();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to save donor");
    } finally {
      setSaving(false);
    }
  };

  const handleViewDonor = async (donor) => {
    try {
      setSelectedDonor(donor);

      if (!isDemoMode) {
        const response = await axiosInstance.get(
          `/welfare/donors/${donor.id}/donations`
        );
        setSelectedDonorDonations(response.data.data || []);
      } else {
        setSelectedDonorDonations(
          donations.filter((donation) => donation.donor_id === donor.id)
        );
      }

      setDonorViewModalOpen(true);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to fetch donor donations");
    }
  };

  const handleEditDonor = (donor) => {
    setSelectedDonor(donor);

    setDonorForm({
      fullName: donor.full_name || "",
      phone: donor.phone || "",
      email: donor.email || "",
      address: donor.address || "",
    });

    setDonorModalOpen(true);
  };

  const handleDeleteDonorClick = (donor) => {
    setSelectedDonor(donor);
    setDonorDeleteModalOpen(true);
  };

  const confirmDeleteDonor = async () => {
    if (!selectedDonor?.id) return;

    try {
      setDeleting(true);

      if (!isDemoMode) {
        await axiosInstance.delete(`/welfare/donors/${selectedDonor.id}`);
      }

      setDonors((prev) =>
        prev.filter((donor) => donor.id !== selectedDonor.id)
      );

      setDonorDeleteModalOpen(false);
      setSelectedDonor(null);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete donor");
    } finally {
      setDeleting(false);
    }
  };

  const resetCharityForm = () => {
    setCharityForm({
      charityName: "",
      fatherName: "",
      contactPerson: "",
      phone: "",
      cnic: "",
      address: "",
      familyMembers: "",
      monthlyIncome: "",
      description: "",

      charityType: "",
      amount: "",
      itemName: "",
      quantity: "",
      charityDate: "",
      recordNote: "",
    });
  };

  const resetCharityRecordForm = () => {
    setCharityRecordForm({
      charityType: "",
      amount: "",
      itemName: "",
      quantity: "",
      charityDate: "",
      note: "",
    });
  };

  const openAddCharityModal = () => {
    setSelectedCharity(null);
    resetCharityForm();
    setCharityModalOpen(true);
  };

  const saveCharity = async (event) => {
    event.preventDefault();

    if (!charityForm.charityName.trim()) {
      alert("Person name is required.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        charityName: charityForm.charityName.trim(),
        fatherName: charityForm.fatherName || null,
        contactPerson: charityForm.contactPerson || null,
        phone: charityForm.phone || null,
        cnic: charityForm.cnic || null,
        address: charityForm.address || null,
        familyMembers: Number(charityForm.familyMembers || 0),
        monthlyIncome: Number(charityForm.monthlyIncome || 0),
        description: charityForm.description || null,

        charityType: charityForm.charityType || null,
        amount: Number(charityForm.amount || 0),
        itemName: charityForm.itemName || null,
        quantity: Number(charityForm.quantity || 0),
        charityDate: charityForm.charityDate || null,
        recordNote: charityForm.recordNote || null,
      };

      if (selectedCharity?.id) {
        if (!isDemoMode) {
          await axiosInstance.put(
            `/welfare/charities/${selectedCharity.id}`,
            payload
          );
          fetchWelfareData();
        }
      } else {
        if (!isDemoMode) {
          await axiosInstance.post("/welfare/charities", payload);
          fetchWelfareData();
        }
      }

      setCharityModalOpen(false);
      setSelectedCharity(null);
      resetCharityForm();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to save charity profile");
    } finally {
      setSaving(false);
    }
  };

  const handleViewCharity = async (charity) => {
    try {
      setSelectedCharity(charity);

      if (!isDemoMode) {
        const response = await axiosInstance.get(
          `/welfare/charities/${charity.id}/history`
        );

        setSelectedCharityHistory(response.data.data || []);
      } else {
        setSelectedCharityHistory([]);
      }

      setCharityViewModalOpen(true);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to fetch charity history");
    }
  };

  const handleEditCharity = (charity) => {
    setSelectedCharity(charity);

    setCharityForm({
      charityName: charity.charity_name || "",
      fatherName: charity.father_name || "",
      contactPerson: charity.contact_person || "",
      phone: charity.phone || "",
      cnic: charity.cnic || "",
      address: charity.address || "",
      familyMembers: charity.family_members || "",
      monthlyIncome: charity.monthly_income || "",
      description: charity.description || "",

      charityType: "",
      amount: "",
      itemName: "",
      quantity: "",
      charityDate: "",
      recordNote: "",
    });

    setCharityModalOpen(true);
  };

  const openCharityRecordModal = () => {
    resetCharityRecordForm();
    setCharityRecordModalOpen(true);
  };

  const createCharityForSelectedProfile = async (event) => {
    event.preventDefault();

    if (!selectedCharity?.id) {
      alert("Please select charity profile first.");
      return;
    }

    try {
      setSaving(true);

      await axiosInstance.post(`/welfare/charities/${selectedCharity.id}/history`, {
        charityType: charityRecordForm.charityType || null,
        amount: Number(charityRecordForm.amount || 0),
        itemName: charityRecordForm.itemName || null,
        quantity: Number(charityRecordForm.quantity || 0),
        charityDate: charityRecordForm.charityDate || null,
        note: charityRecordForm.note || null,
      });

      const response = await axiosInstance.get(
        `/welfare/charities/${selectedCharity.id}/history`
      );

      setSelectedCharityHistory(response.data.data || []);
      setCharityRecordModalOpen(false);
      resetCharityRecordForm();
      fetchWelfareData();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to add charity record");
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteCharity = async () => {
    if (!selectedCharity?.id) return;

    try {
      setDeleting(true);

      if (!isDemoMode) {
        await axiosInstance.delete(`/welfare/charities/${selectedCharity.id}`);
      }

      setCharities((prev) =>
        prev.filter((charity) => charity.id !== selectedCharity.id)
      );

      setCharityDeleteModalOpen(false);
      setSelectedCharity(null);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete charity");
    } finally {
      setDeleting(false);
    }
  };

  const saveDonation = async (event) => {
    event.preventDefault();

    if (!donationForm.name.trim()) {
      alert("Donor name is required.");
      return;
    }

    if (!donationForm.amount || Number(donationForm.amount) <= 0) {
      alert("Donation amount must be greater than zero.");
      return;
    }

    if (!donationForm.methodId) {
      alert("Donation method is required.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        donorId: donationForm.donorId || null,
        name: donationForm.name.trim(),
        contact: donationForm.contact || null,
        amount: Number(donationForm.amount),
        methodId: Number(donationForm.methodId),
        date: donationForm.date || getTodayDate(),
      };

      if (selectedDonation?.id) {
        await axiosInstance.put(`/welfare/donations/${selectedDonation.id}`, payload);
      } else {
        await axiosInstance.post("/welfare/donations", payload);
      }

      setDonationModalOpen(false);
      setSelectedDonation(null);
      resetDonationForm();
      fetchWelfareData();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to save donation");
    } finally {
      setSaving(false);
    }
  };

  const resetDonorDonationForm = () => {
    setDonorDonationForm({
      amount: "",
      methodId: "",
      date: "",
    });
  };

  const openDonorDonationModal = () => {
    resetDonorDonationForm();
    setDonorDonationModalOpen(true);
  };

  const createDonationForSelectedDonor = async (event) => {
    event.preventDefault();

    if (!selectedDonor?.id) {
      alert("Please select donor first.");
      return;
    }

    if (!donorDonationForm.amount || Number(donorDonationForm.amount) <= 0) {
      alert("Donation amount must be greater than zero.");
      return;
    }

    if (!donorDonationForm.methodId) {
      alert("Donation method is required.");
      return;
    }

    try {
      setSaving(true);

      await axiosInstance.post(`/welfare/donors/${selectedDonor.id}/donations`, {
        amount: Number(donorDonationForm.amount),
        methodId: Number(donorDonationForm.methodId),
        date: donorDonationForm.date || null,
      });

      const response = await axiosInstance.get(
        `/welfare/donors/${selectedDonor.id}/donations`
      );

      setSelectedDonorDonations(response.data.data || []);
      setDonorDonationModalOpen(false);
      resetDonorDonationForm();
      fetchWelfareData();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to add donation for donor");
    } finally {
      setSaving(false);
    }
  };

  const handleEditDonation = async (donation) => {
    setSelectedDonation(donation);

    try {
      const [donorsRes, methodsRes] = await Promise.all([
        axiosInstance.get("/welfare/donors?page=1&limit=100"),
        axiosInstance.get("/welfare/donation-methods"),
      ]);

      setDonors(donorsRes.data.data || []);
      setDonationMethods(methodsRes.data.data || []);
    } catch (error) {
      console.error("Donation edit data error:", error.response?.data?.message);
    }

    setDonationForm({
      donorId: donation.donor_id || "",
      name: donation.name || donation.donor_name || "",
      contact: donation.contact || "",
      amount: donation.amount || "",
      methodId: donation.donation_method_id || "",
      date: donation.donation_date?.split("T")[0] || getTodayDate(),
    });

    setDonationModalOpen(true);
  };

  const handleViewDonation = (donation) => {
    setSelectedDonation(donation);
    setDonationViewModalOpen(true);
  };

  const handleDeleteDonationClick = (donation) => {
    setSelectedDonation(donation);
    setDonationDeleteModalOpen(true);
  };

  const confirmDeleteDonation = async () => {
    if (!selectedDonation?.id) return;

    try {
      setDeleting(true);

      if (!isDemoMode) {
        await axiosInstance.delete(`/welfare/donations/${selectedDonation.id}`);
      }

      setDonations((prev) =>
        prev.filter((donation) => donation.id !== selectedDonation.id)
      );

      setDonationDeleteModalOpen(false);
      setSelectedDonation(null);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete donation");
    } finally {
      setDeleting(false);
    }
  };

  const resetApplicationForm = () => {
    setApplicationForm({
      applicantName: "",
      fatherName: "",
      phone: "",
      cnic: "",
      gender: "",
      maritalStatus: "",
      familyMembers: "",
      residenceType: "",
      educationLevel: "",
      monthlyIncome: "",
      monthlyExpense: "",
      supportType: "",
      requestedAmount: "",
      address: "",
      verificationNotes: "",
      area: "",
      houseStatus: "",
      community: "",
      needDescription: "",
      schoolName: "",
      verifierName: "",
      officeRemarks: "",
      needsSchoolFee: false,
      needsSchoolDress: false,
      needsSchoolUniform: false,
      needsSchoolBag: false,
      needsSchoolShoes: false,
      needsUniversityFee: false,
      needsOtherEducationHelp: false,
    });
  };

  const openAddApplicationModal = () => {
    setSelectedApplication(null);
    resetApplicationForm();
    setApplicationModalOpen(true);
  };

  const saveApplication = async (event) => {
    event.preventDefault();

    const payload = {
      ...applicationForm,
      familyMembers: Number(applicationForm.familyMembers || 0),
      monthlyIncome: Number(applicationForm.monthlyIncome || 0),
      monthlyExpense: Number(applicationForm.monthlyExpense || 0),
      requestedAmount: Number(applicationForm.requestedAmount || 0),
    };

    try {
      setSaving(true);

      if (selectedApplication?.id) {
        if (!isDemoMode) {
          await axiosInstance.put(
            `/welfare/applications/${selectedApplication.id}`,
            payload
          );
          fetchWelfareData();
        } else {
          setApplications((prev) =>
            prev.map((application) =>
              application.id === selectedApplication.id
                ? {
                  ...application,
                  applicant_name: applicationForm.applicantName,
                  father_name: applicationForm.fatherName,
                  phone: applicationForm.phone,
                  cnic: applicationForm.cnic,
                  gender: applicationForm.gender,
                  marital_status: applicationForm.maritalStatus,
                  family_members: Number(applicationForm.familyMembers || 0),
                  // residence_type: applicationForm.residenceType,
                  // education_level: applicationForm.educationLevel,
                  monthly_income: Number(applicationForm.monthlyIncome || 0),
                  monthly_expense: Number(applicationForm.monthlyExpense || 0),
                  // support_type: applicationForm.supportType,
                  requested_amount: Number(applicationForm.requestedAmount || 0),
                  address: applicationForm.address,
                  verification_notes: applicationForm.verificationNotes,

                  area: applicationForm.area,
                  house_status: applicationForm.houseStatus,
                  community: applicationForm.community,
                  need_description: applicationForm.needDescription,
                  school_name: applicationForm.schoolName,
                  verifier_name: applicationForm.verifierName,
                  office_remarks: applicationForm.officeRemarks,
                  needs_school_fee: applicationForm.needsSchoolFee,
                  needs_school_dress: applicationForm.needsSchoolDress,
                  needs_school_uniform: applicationForm.needsSchoolUniform,
                  needs_school_bag: applicationForm.needsSchoolBag,
                  needs_school_shoes: applicationForm.needsSchoolShoes,
                  needs_university_fee: applicationForm.needsUniversityFee,
                  needs_other_education_help: applicationForm.needsOtherEducationHelp,
                }
                : application
            )
          );
        }
      } else {
        if (!isDemoMode) {
          await axiosInstance.post("/welfare/applications", payload);
          fetchWelfareData();
        } else {
          setApplications((prev) => [
            {
              id: Date.now(),
              applicant_name: applicationForm.applicantName,
              father_name: applicationForm.fatherName,
              phone: applicationForm.phone,
              cnic: applicationForm.cnic,
              gender: applicationForm.gender,
              marital_status: applicationForm.maritalStatus,
              family_members: Number(applicationForm.familyMembers || 0),
              // residence_type: applicationForm.residenceType,
              // education_level: applicationForm.educationLevel,
              monthly_income: Number(applicationForm.monthlyIncome || 0),
              monthly_expense: Number(applicationForm.monthlyExpense || 0),
              // support_type: applicationForm.supportType,
              requested_amount: Number(applicationForm.requestedAmount || 0),
              approved_amount: 0,
              case_status: "pending",
              address: applicationForm.address,
              verification_notes: applicationForm.verificationNotes,

              area: applicationForm.area,
              house_status: applicationForm.houseStatus,
              community: applicationForm.community,
              need_description: applicationForm.needDescription,
              school_name: applicationForm.schoolName,
              verifier_name: applicationForm.verifierName,
              office_remarks: applicationForm.officeRemarks,
              needs_school_fee: applicationForm.needsSchoolFee,
              needs_school_dress: applicationForm.needsSchoolDress,
              needs_school_uniform: applicationForm.needsSchoolUniform,
              needs_school_bag: applicationForm.needsSchoolBag,
              needs_school_shoes: applicationForm.needsSchoolShoes,
              needs_university_fee: applicationForm.needsUniversityFee,
              needs_other_education_help: applicationForm.needsOtherEducationHelp,
              created_at: new Date().toISOString(),
            },
            ...prev,
          ]);
        }
      }

      setApplicationModalOpen(false);
      setSelectedApplication(null);
      resetApplicationForm();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to save application");
    } finally {
      setSaving(false);
    }
  };

  const handleViewApplication = async (application) => {
    try {
      if (!isDemoMode) {
        const response = await axiosInstance.get(
          `/welfare/applications/${application.id}`
        );
        setSelectedApplication(response.data.data);
      } else {
        setSelectedApplication(application);
      }

      setApplicationViewModalOpen(true);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to fetch application");
    }
  };

  const handleEditApplication = async (application) => {
    try {
      let selected = application;

      if (!isDemoMode) {
        const response = await axiosInstance.get(
          `/welfare/applications/${application.id}`
        );
        selected = response.data.data;
      }

      setSelectedApplication(selected);

      setApplicationForm({
        applicantName: selected.applicant_name || "",
        fatherName: selected.father_name || "",
        phone: selected.phone || "",
        cnic: selected.cnic || "",
        gender: selected.gender || "",
        maritalStatus: selected.marital_status || "",
        familyMembers: selected.family_members || "",
        // residenceType: selected.residence_type || "",
        // educationLevel: selected.education_level || "",
        monthlyIncome: selected.monthly_income || "",
        monthlyExpense: selected.monthly_expense || "",
        // supportType: selected.support_type || "",
        requestedAmount: selected.requested_amount || "",
        address: selected.address || "",
        verificationNotes: selected.verification_notes || "",
        area: selected.area || "",
        houseStatus: selected.house_status || "",
        community: selected.community || "",
        needDescription: selected.need_description || "",
        schoolName: selected.school_name || "",
        verifierName: selected.verifier_name || "",
        officeRemarks: selected.office_remarks || "",
        needsSchoolFee: Boolean(selected.needs_school_fee),
        needsSchoolDress: Boolean(selected.needs_school_dress),
        needsSchoolUniform: Boolean(selected.needs_school_uniform),
        needsSchoolBag: Boolean(selected.needs_school_bag),
        needsSchoolShoes: Boolean(selected.needs_school_shoes),
        needsUniversityFee: Boolean(selected.needs_university_fee),
        needsOtherEducationHelp: Boolean(selected.needs_other_education_help),
      });

      setApplicationModalOpen(true);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to fetch application");
    }
  };

  const handleDeleteApplicationClick = (application) => {
    setSelectedApplication(application);
    setApplicationDeleteModalOpen(true);
  };

  const confirmDeleteApplication = async () => {
    if (!selectedApplication?.id) return;

    try {
      setDeleting(true);

      if (!isDemoMode) {
        await axiosInstance.delete(
          `/welfare/applications/${selectedApplication.id}`
        );
      }

      setApplications((prev) =>
        prev.filter((application) => application.id !== selectedApplication.id)
      );

      setApplicationDeleteModalOpen(false);
      setSelectedApplication(null);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete application");
    } finally {
      setDeleting(false);
    }
  };

  const openStatusModal = (application, status) => {
    setSelectedApplication(application);
    setStatusForm({
      caseStatus: status,
      approvedAmount:
        status === "approved" ? application.requested_amount || "" : "",
      verificationNotes: "",
    });
    setStatusModalOpen(true);
  };

  const updateApplicationStatus = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);

      await axiosInstance.patch(
        `/welfare/applications/${selectedApplication.id}/status`,
        {
          caseStatus: statusForm.caseStatus,
          approvedAmount: statusForm.approvedAmount
            ? Number(statusForm.approvedAmount)
            : 0,
          verificationNotes: statusForm.verificationNotes || null,
        }
      );

      setStatusModalOpen(false);
      setSelectedApplication(null);
      fetchWelfareData();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update application");
    } finally {
      setSaving(false);
    }
  };

  const getCaseBadgeType = (status) => {
    if (status === "approved") return "success";
    if (status === "completed") return "info";
    if (status === "rejected") return "danger";
    return "warning";
  };

  const handleQuickAdd = (type) => {
    setQuickAddOpen(false);

    if (type === "donation") {
      navigate("/app/welfare/donations", {
        state: { openModal: "donation" },
      });
    }

    if (type === "charity") {
      navigate("/app/welfare/charities", {
        state: { openModal: "charity" },
      });
    }

    if (type === "application") {
      navigate("/app/welfare/applications", {
        state: { openModal: "application" },
      });
    }
  };

  const handleDashboardCardClick = (target, status = "") => {
    if (target === "donations") {
      navigate("/app/welfare/donations");
      return;
    }

    if (target === "expenses") {
      navigate("/app/expenses");
      return;
    }

    if (target === "reports") {
      navigate("/app/reports");
      return;
    }

    if (target === "applications") {
      if (status) {
        navigate(`/app/welfare/applications?caseStatus=${status}`);
      } else {
        navigate("/app/welfare/applications");
      }

      return;
    }

    if (target === "charityRecords") {
      navigate("/app/welfare/charity-records");
    }
  };

  const charityColumns = [
    {
      key: "charity_name",
      title: "Person",
      render: (row) => (
        <div>
          <strong>{row.charity_name}</strong>
          <span className="table-subtext">{row.phone || row.cnic || "-"}</span>
        </div>
      ),
    },
    {
      key: "father_name",
      title: "Father Name",
      render: (row) => row.father_name || "-",
    },
    {
      key: "last_charity_type",
      title: "Last Charity",
      render: (row) => row.last_charity_type || row.charity_type || "-",
    },
    {
      key: "total_records",
      title: "Records",
      render: (row) => row.total_records || 0,
    },
    {
      key: "total_amount",
      title: "Total Amount",
      render: (row) => formatCurrency(row.total_amount || 0),
    },
    {
      key: "last_charity_date",
      title: "Last Date",
      render: (row) => formatDate(row.last_charity_date),
    },
    {
      key: "actions",
      title: "Actions",
      render: (row) => (
        <ActionButtons
          onView={() => handleViewCharity(row)}
          onEdit={() => handleEditCharity(row)}
          onDelete={() => handleDeleteCharityClick(row)}
        />
      ),
    },
  ];

  const charityRecordColumns = [
    {
      key: "beneficiary_name",
      title: "Beneficiary",
      render: (row) => (
        <div>
          <strong>{row.beneficiary_name || "-"}</strong>
          <span className="table-subtext">
            {row.beneficiary_phone || row.beneficiary_cnic || "-"}
          </span>
        </div>
      ),
    },
    {
      key: "charity_type",
      title: "Type",
      render: (row) => row.charity_type || "-",
    },
    {
      key: "amount",
      title: "Amount",
      render: (row) => formatCurrency(row.amount || 0),
    },
    {
      key: "item_name",
      title: "Item",
      render: (row) => row.item_name || "-",
    },
    {
      key: "quantity",
      title: "Qty",
      render: (row) => row.quantity || 0,
    },
    {
      key: "charity_date",
      title: "Date",
      render: (row) => formatDate(row.charity_date),
    },
    {
      key: "note",
      title: "Note",
      render: (row) => row.note || "-",
    },
  ];

  const donationColumns = [
    {
      key: "name",
      title: "Name",
      render: (row) => (
        <div>
          <strong>{row.name || row.donor_name || "-"}</strong>
          <span className="table-subtext">{row.contact || "-"}</span>
        </div>
      ),
    },
    {
      key: "amount",
      title: "Amount",
      render: (row) => <strong>{formatCurrency(row.amount)}</strong>,
    },
    {
      key: "method",
      title: "Method",
      render: (row) => row.method || row.donation_method || "-",
    },
    {
      key: "donation_date",
      title: "Date",
      render: (row) => formatDate(row.donation_date),
    },
    {
      key: "actions",
      title: "Actions",
      render: (row) => (
        <ActionButtons
          onView={() => handleViewDonation(row)}
          onEdit={() => handleEditDonation(row)}
          onDelete={() => handleDeleteDonationClick(row)}
          canView={true}
          canEdit={true}
          canDelete={true}
        />
      ),
    },
  ];

  const applicationColumns = [
    {
      key: "applicant_name",
      title: "Applicant",
      render: (row) => (
        <div>
          <strong>{row.applicant_name}</strong>
          <span className="table-subtext">{row.phone || "-"}</span>
        </div>
      ),
    },
    {
      key: "cnic",
      title: "CNIC",
      render: (row) => row.cnic || "-",
    },
    // {
    //   key: "support_type",
    //   title: "Support",
    //   render: (row) => row.support_type || "-",
    // },
    {
      key: "requested_amount",
      title: "Requested",
      render: (row) => formatCurrency(row.requested_amount),
    },
    {
      key: "approved_amount",
      title: "Approved",
      render: (row) => formatCurrency(row.approved_amount),
    },
    {
      key: "case_status",
      title: "Status",
      render: (row) => (
        <Badge type={getCaseBadgeType(row.case_status)}>
          {row.case_status}
        </Badge>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (row) => (
        <div className="welfare-actions">
          <ActionButtons
            onView={() => handleViewApplication(row)}
            onEdit={() => handleEditApplication(row)}
            onDelete={() => handleDeleteApplicationClick(row)}
          />
          {row.case_status === "pending" && (
            <>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => openStatusModal(row, "approved")}
              >
                <CheckCircle size={14} /> Approve
              </Button>

              <Button
                size="sm"
                variant="danger"
                onClick={() => openStatusModal(row, "rejected")}
              >
                <XCircle size={14} /> Reject
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  // const donationByDate = donations.reduce((acc, donation) => {
  //   const date = donation.donation_date
  //     ? new Date(donation.donation_date).toLocaleDateString("en-GB")
  //     : "Unknown";

  //   const existing = acc.find((item) => item.date === date);

  //   if (existing) {
  //     existing.amount += Number(donation.amount || 0);
  //   } else {
  //     acc.push({
  //       date,
  //       amount: Number(donation.amount || 0),
  //     });
  //   }

  //   return acc;
  // }, []);

  // const monthlyDonations = donations.reduce((acc, donation) => {
  //   if (!donation.donation_date) return acc;

  //   const donationDate = new Date(donation.donation_date);

  //   const month = donationDate.toLocaleString("en-US", {
  //     month: "short",
  //     year: "numeric",
  //   });

  //   const existing = acc.find((item) => item.month === month);

  //   if (existing) {
  //     existing.amount += Number(donation.amount || 0);
  //   } else {
  //     acc.push({
  //       month,
  //       amount: Number(donation.amount || 0),
  //     });
  //   }

  //   return acc;
  // }, []);

  const monthlyDonations = dashboard?.monthlyDonations || [];
  const monthlyCharity = dashboard?.monthlyCharity || [];

  const selectedDonorTotalDonation = selectedDonorDonations.reduce(
    (sum, donation) => sum + Number(donation.amount || 0),
    0
  );
  if (loading) {
    return (
      <div className="page">
        <Loader text="Loading welfare dashboard..." />
      </div>
    );
  }

  const donorColumns = [
    {
      key: "donor_name",
      title: "Donor Name",
      render: (row) => (
        <span
          type="button"
          className="donor-profile-link"
          onClick={() => handleViewDonor(row)}
        >
          {row.donor_name || row.full_name || row.name || "-"}
        </span>
      ),
    },
    {
      key: "phone",
      title: "Phone",
      render: (row) => row.phone || "-",
    },
    {
      key: "email",
      title: "Email",
      render: (row) => row.email || "-",
    },
    {
      key: "address",
      title: "Address",
      render: (row) => row.address || "-",
    },
    {
      key: "actions",
      title: "Actions",
      render: (row) => (
        <ActionButtons
          onView={() => handleViewDonor(row)}
          onEdit={() => handleEditDonor(row)}
          onDelete={() => handleDeleteDonorClick(row)}
        />
      ),
    },
  ];

  return (
    <div className="page welfare-page">
      {activeTab === "dashboard" ? (
        <div className="dashboard-welcome-header">
          <div>
            <h1>
              Welcome back, {user?.fullName || user?.full_name || "User"}
            </h1>
            <p>{todayText}</p>
          </div>

          <div className="welfare-header-actions">
            <div className="quick-add-wrapper">
              <button
                type="button"
                className="quick-add-main-btn"
                onClick={() => setQuickAddOpen((prev) => !prev)}
              >
                <Plus size={16} />
                Add
                <ChevronDown size={15} />
              </button>

              {quickAddOpen && (
                <div className="quick-add-menu">
                  <button
                    type="button"
                    onClick={() => handleQuickAdd("donation")}
                  >
                    Add Donation
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickAdd("application")}
                  >
                    Add Application
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="page-header">
          <div>
            <h1 className="page-title">
              {activeTab === "donors" && "Donors"}
              {activeTab === "charities" && "Beneficiaries"}
              {activeTab === "charityRecords" && "Charity History"}
              {activeTab === "donations" && "Donations"}
              {activeTab === "applications" && "Welfare Applications"}
            </h1>

            <p className="page-subtitle">
              Manage welfare records, donations, donors, charities and applications.
            </p>
          </div>

          {activeTab === "donors" && (
            <Button onClick={openAddDonorModal}>
              <Plus size={16} /> Add Donor
            </Button>
          )}

          {activeTab === "donations" && (
            <Button onClick={openAddDonationModal}>
              <Plus size={16} /> Add Donation
            </Button>
          )}

          {activeTab === "applications" && (
            <Button onClick={openAddApplicationModal}>
              <Plus size={16} /> Add Application
            </Button>
          )}


        </div>
      )}

      {error && <div className="welfare-error">{error}</div>}

      {activeTab === "dashboard" && (
        <>
          <div className="welfare-summary-grid">
            <Card
              className="welfare-click-card"
              onClick={() => handleDashboardCardClick("donations")}
            >
              <div className="welfare-summary-card">
                <div className="welfare-summary-icon">
                  <Wallet size={24} />
                </div>

                <div>
                  <p>Total Donations</p>
                  <h2>{formatCurrency(dashboard?.totalDonations)}</h2>
                </div>
              </div>
            </Card>

            <Card
              className="welfare-click-card"
              onClick={() => handleDashboardCardClick("charityRecords")}
            >
              <div className="welfare-summary-card">
                <div className="welfare-summary-icon danger">
                  <HeartHandshake size={24} />
                </div>

                <div>
                  <p>Charity</p>
                  <h2>{formatCurrency(dashboard?.totalWelfareExpenses)}</h2>
                </div>
              </div>
            </Card>

            <Card
              className="welfare-click-card"
              onClick={() => handleDashboardCardClick("reports")}
            >
              <div className="welfare-summary-card">
                <div className="welfare-summary-icon success">
                  <FileCheck size={24} />
                </div>

                <div>
                  <p>Available Balance</p>
                  <h2>{formatCurrency(dashboard?.availableBalance)}</h2>
                </div>
              </div>
            </Card>

            <Card
              className="welfare-click-card"
              onClick={() => handleDashboardCardClick("applications")}
            >
              <div className="welfare-summary-card">
                <div className="welfare-summary-icon">
                  <Users size={24} />
                </div>

                <div>
                  <p>Total Cases</p>
                  <h2>{dashboard?.totalCases || 0}</h2>
                </div>
              </div>
            </Card>
          </div>

          <div className="welfare-summary-grid small">
            <Card
              className="welfare-click-card"
              onClick={() => handleDashboardCardClick("applications", "pending")}
            >
              <div className="welfare-mini-stat">
                <p>Pending Cases</p>
                <h3>{dashboard?.pendingCases || 0}</h3>
              </div>
            </Card>

            <Card
              className="welfare-click-card"
              onClick={() => handleDashboardCardClick("applications", "approved")}
            >
              <div className="welfare-mini-stat">
                <p>Approved Cases</p>
                <h3>{dashboard?.approvedCases || 0}</h3>
              </div>
            </Card>

            <Card
              className="welfare-click-card"
              onClick={() => handleDashboardCardClick("reports")}
            >
              <div className="welfare-mini-stat">
                <p>Lives Touched</p>
                <h3>{dashboard?.livesTouched || 0}</h3>
              </div>
            </Card>

            <Card
              className="welfare-click-card"
              onClick={() => handleDashboardCardClick("applications", "approved")}
            >
              <div className="welfare-mini-stat">
                <p>Active Grants</p>
                <h3>{dashboard?.activeGrants || 0}</h3>
              </div>
            </Card>
          </div>
          <div className="welfare-graphs-grid">
            <Card title="Monthly Donations" subtitle="Last 12 months donations">
              <div className="welfare-chart-box">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyDonations}
                    margin={{ top: 10, right: 20, left: 5, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" interval={0} />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Bar dataKey="amount" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card title="Monthly Charity" subtitle="Last 12 months charity support">
              <div className="welfare-chart-box">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={monthlyCharity}
                    margin={{ top: 10, right: 20, left: 5, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" interval={0} />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </>
      )}

      {activeTab === "donors" && (
        <Card className="donors-card">
          <div className="filter-bar">
            <Input
              className="donor-search-input"
              name="donorSearch"
              value={filters.donorSearch}
              onChange={handleFilterChange}
              placeholder="Search donor name, phone, email"
            />
          </div>

          <Table columns={donorColumns} data={donors} emptyText="No donors found" />
        </Card>
      )}

      {activeTab === "charities" && (
        <Card className="charities-card">
          <div className="filter-bar">
            <Input
              name="beneficiarySearch"
              value={filters.beneficiarySearch}
              onChange={handleFilterChange}
              placeholder="Search beneficiary name, phone, CNIC"
            />
          </div>

          <Table
            columns={charityColumns}
            data={charities}
            emptyText="No beneficiaries found"
          />
        </Card>
      )}

      {activeTab === "charityRecords" && (
        <Card
          title="Charity History"
          subtitle="View all charity records generated from approved applications"
        >
          <div className="filter-bar">
            <Input
              label="Search"
              name="charityRecordSearch"
              value={filters.charityRecordSearch}
              onChange={handleFilterChange}
              placeholder="Search beneficiary, type, item, note"
            />



            <DateRangePicker
              fromDate={filters.charityRecordFromDate}
              toDate={filters.charityRecordToDate}
              onChange={({ fromDate, toDate }) => {
                setFilters((prev) => ({
                  ...prev,
                  charityRecordFromDate: fromDate,
                  charityRecordToDate: toDate,
                }));
              }}
            />
          </div>

          <Table
            columns={charityRecordColumns}
            data={charityRecords}
            emptyText="No charity history found"
          />
        </Card>
      )}

      {activeTab === "donations" && (
        <Card className="donations-card">
          <div className="filter-bar">
            <Input
              className="donation-search-input"
              name="donationSearch"
              value={filters.donationSearch}
              onChange={handleFilterChange}
              placeholder="Search donor, phone, method"
            />
            <div className="donation-filter-right">
              <DateRangePicker
                fromDate={filters.donationFromDate}
                toDate={filters.donationToDate}
                onChange={({ fromDate, toDate }) => {
                  setFilters((prev) => ({
                    ...prev,
                    donationFromDate: fromDate,
                    donationToDate: toDate,
                  }));
                }}
              />

              <Select

                name="donationMethodId"
                value={filters.donationMethodId}
                onChange={handleFilterChange}
                options={[
                  { label: "All Methods", value: "" },
                  ...donationMethods.map((method) => ({
                    label: method.method_name,
                    value: method.id,
                  })),
                ]}
              />

            </div>



          </div>

          <Table
            columns={donationColumns}
            data={donations}
            emptyText="No donations found"
          />
        </Card>
      )}

      {activeTab === "applications" && (
        <Card className="applications-card">
          <div className="filter-bar">
            <Input
              name="applicationSearch"
              value={filters.applicationSearch}
              onChange={handleFilterChange}
              placeholder="Search applicant, father, phone, CNIC"
            />

            <Select
              name="applicationStatus"
              value={filters.applicationStatus}
              onChange={handleFilterChange}
              options={[
                { label: "All Status", value: "" },
                { label: "Pending", value: "pending" },
                { label: "Approved", value: "approved" },
                { label: "Rejected", value: "rejected" },
                { label: "Completed", value: "completed" },
              ]}
            />

            {/* <Input
              label="Support Type"
              name="applicationSupportType"
              value={filters.applicationSupportType}
              onChange={handleFilterChange}
              placeholder="Example: Food, Education, Medical"
            /> */}
          </div>

          <Table
            columns={applicationColumns}
            data={applications}
            emptyText="No applications found"
          />
        </Card>
      )}

      <Modal
        open={donorModalOpen}
        title={selectedDonor?.id ? "Edit Donor" : "Add Donor"}
        onClose={() => {
          setDonorModalOpen(false);
          setSelectedDonor(null);
          resetDonorForm();
        }}
        size="md"
      >
        <form onSubmit={saveDonor}>
          <Input label="Full Name" name="fullName" value={donorForm.fullName} onChange={handleChange(setDonorForm)} required />
          <Input label="Phone" name="phone" value={donorForm.phone} onChange={handleChange(setDonorForm)} />
          <Input label="Email" name="email" type="email" value={donorForm.email} onChange={handleChange(setDonorForm)} />
          <Input label="Address" name="address" value={donorForm.address} onChange={handleChange(setDonorForm)} />

          <div className="modal-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setDonorModalOpen(false);
                setSelectedDonor(null);
                resetDonorForm();
              }}
            >
              Cancel
            </Button>

            <Button type="submit" loading={saving}>
              {selectedDonor?.id ? "Update Donor" : "Save Donor"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={donorViewModalOpen}
        title="Donor Profile"
        onClose={() => {
          setDonorViewModalOpen(false);
          setSelectedDonor(null);
          setSelectedDonorDonations([]);
        }}
        size="lg"
      >
        {selectedDonor && (
          <>
            <div className="welfare-detail-grid">
              <div>
                <strong>Name:</strong>
                <p>{selectedDonor.full_name || "-"}</p>
              </div>

              <div>
                <strong>Phone:</strong>
                <p>{selectedDonor.phone || "-"}</p>
              </div>

              <div>
                <strong>Email:</strong>
                <p>{selectedDonor.email || "-"}</p>
              </div>

              <div>
                <strong>Address:</strong>
                <p>{selectedDonor.address || "-"}</p>
              </div>
            </div>

            <div style={{ marginTop: "24px" }}>
              <div className="modal-section-header donor-history-header">
                <div>
                  <h3>Donation History</h3>
                  <p>All donations made by this donor.</p>
                </div>

                <div className="donor-total-donation">
                  <span>Total Donation</span>
                  <strong>{formatCurrency(selectedDonorTotalDonation)}</strong>
                </div>

                <Button type="button" onClick={openDonorDonationModal}>
                  <Plus size={16} /> Add Donation
                </Button>
              </div>

              <Table
                columns={[
                  {
                    key: "amount",
                    title: "Amount",
                    render: (row) => <strong>{formatCurrency(row.amount)}</strong>,
                  },
                  {
                    key: "method",
                    title: "Method",
                    render: (row) => row.method || row.donation_method || "-",
                  },
                  {
                    key: "donation_date",
                    title: "Date",
                    render: (row) => formatDate(row.donation_date),
                  },
                  {
                    key: "created_by_name",
                    title: "Created By",
                    render: (row) => row.created_by_name || "-",
                  },
                ]}
                data={selectedDonorDonations}
                emptyText="No donation history found"
              />
            </div>
          </>
        )}
      </Modal>

      <Modal
        open={donorDonationModalOpen}
        title={`Add Donation - ${selectedDonor?.full_name || ""}`}
        onClose={() => {
          setDonorDonationModalOpen(false);
          resetDonorDonationForm();
        }}
        size="md"
      >
        <form onSubmit={createDonationForSelectedDonor}>
          <Input
            label="Amount"
            name="amount"
            type="number"
            value={donorDonationForm.amount}
            onChange={handleChange(setDonorDonationForm)}
            required
          />

          <Select
            label="Method"
            name="methodId"
            value={donorDonationForm.methodId}
            onChange={handleChange(setDonorDonationForm)}
            options={donationMethods.map((method) => ({
              label: method.method_name,
              value: method.id,
            }))}
            required
          />

          <Input
            label="Date"
            name="date"
            type="date"
            value={donorDonationForm.date}
            onChange={handleChange(setDonorDonationForm)}
          />

          <div className="modal-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setDonorDonationModalOpen(false);
                resetDonorDonationForm();
              }}
            >
              Cancel
            </Button>

            <Button type="submit" loading={saving}>
              Save Donation
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteModal
        open={donorDeleteModalOpen}
        title="Delete Donor"
        message={`Are you sure you want to delete ${selectedDonor?.full_name || "this donor"
          }?`}
        loading={deleting}
        onClose={() => setDonorDeleteModalOpen(false)}
        onConfirm={confirmDeleteDonor}
      />

      <Modal
        open={charityModalOpen}
        title={selectedCharity?.id ? "Edit Beneficiary" : "Add Beneficiary"}
        onClose={() => {
          setCharityModalOpen(false);
          setSelectedCharity(null);
          resetCharityForm();
        }}
        size="lg"
      >
        <form onSubmit={saveCharity}>
          <div className="welfare-form-grid">
            <Input label="Full Name" name="charityName" value={charityForm.charityName} onChange={handleChange(setCharityForm)} required />
            <Input label="Father Name" name="fatherName" value={charityForm.fatherName} onChange={handleChange(setCharityForm)} />
            <Input label="Contact Person" name="contactPerson" value={charityForm.contactPerson} onChange={handleChange(setCharityForm)} />
            <Input label="Phone" name="phone" value={charityForm.phone} onChange={handleChange(setCharityForm)} />
            <Input label="CNIC" name="cnic" value={charityForm.cnic} onChange={handleChange(setCharityForm)} />
            <Input label="Family Members" name="familyMembers" type="number" value={charityForm.familyMembers} onChange={handleChange(setCharityForm)} />
            <Input label="Monthly Income" name="monthlyIncome" type="number" value={charityForm.monthlyIncome} onChange={handleChange(setCharityForm)} />
          </div>

          <Input label="Address" name="address" value={charityForm.address} onChange={handleChange(setCharityForm)} />

          <div className="form-group">
            <label>Profile Note</label>
            <textarea name="description" value={charityForm.description} onChange={handleChange(setCharityForm)} rows="3" />
          </div>

          {!selectedCharity?.id && (
            <>
              <hr style={{ margin: "18px 0", border: "none", borderTop: "1px solid var(--border-color)" }} />

              <h3 style={{ marginBottom: "12px" }}>First Charity Record</h3>

              <div className="welfare-form-grid">
                <Input label="Charity Type" name="charityType" value={charityForm.charityType} onChange={handleChange(setCharityForm)} />
                <Input label="Amount" name="amount" type="number" value={charityForm.amount} onChange={handleChange(setCharityForm)} />
                <Input label="Item Name" name="itemName" value={charityForm.itemName} onChange={handleChange(setCharityForm)} />
                <Input label="Quantity" name="quantity" type="number" value={charityForm.quantity} onChange={handleChange(setCharityForm)} />
                <Input label="Charity Date" name="charityDate" type="date" value={charityForm.charityDate} onChange={handleChange(setCharityForm)} />
                <Input label="Record Note" name="recordNote" value={charityForm.recordNote} onChange={handleChange(setCharityForm)} />
              </div>
            </>
          )}

          <div className="modal-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setCharityModalOpen(false);
                setSelectedCharity(null);
                resetCharityForm();
              }}
            >
              Cancel
            </Button>

            <Button type="submit" loading={saving}>
              {selectedCharity?.id ? "Update Beneficiary" : "Save Beneficiary"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={charityViewModalOpen}
        title="Beneficiary Profile"
        onClose={() => {
          setCharityViewModalOpen(false);
          setSelectedCharity(null);
        }}
        size="md"
      >
        {selectedCharity && (
          <>
            <div className="welfare-detail-grid">
              <div><strong>Name:</strong><p>{selectedCharity.charity_name || "-"}</p></div>
              <div><strong>Father Name:</strong><p>{selectedCharity.father_name || "-"}</p></div>
              <div><strong>Contact Person:</strong><p>{selectedCharity.contact_person || "-"}</p></div>
              <div><strong>Phone:</strong><p>{selectedCharity.phone || "-"}</p></div>
              <div><strong>CNIC:</strong><p>{selectedCharity.cnic || "-"}</p></div>
              <div><strong>Family Members:</strong><p>{selectedCharity.family_members || 0}</p></div>
              <div><strong>Monthly Income:</strong><p>{formatCurrency(selectedCharity.monthly_income || 0)}</p></div>
              <div><strong>Address:</strong><p>{selectedCharity.address || "-"}</p></div>
              <div><strong>Status:</strong><p>{selectedCharity.is_active ? "Active" : "Inactive"}</p></div>
              <div><strong>Note:</strong><p>{selectedCharity.description || "-"}</p></div>
            </div>

            <div style={{ marginTop: "24px" }}>
              <div className="modal-section-header">
                <div>
                  <h3>Charity History</h3>
                  <p>All charity records created from approved applications.</p>
                </div>

                <Button
                  type="button"
                  onClick={() => {
                    setCharityViewModalOpen(false);
                    setSelectedCharity(null);
                    setApplicationForm((prev) => ({
                      ...prev,
                      applicantName: selectedCharity.charity_name || "",
                      fatherName: selectedCharity.father_name || "",
                      phone: selectedCharity.phone || "",
                      cnic: selectedCharity.cnic || "",
                      familyMembers: selectedCharity.family_members || "",
                      monthlyIncome: selectedCharity.monthly_income || "",
                      address: selectedCharity.address || "",
                      verificationNotes: selectedCharity.description || "",
                    }));
                    setApplicationModalOpen(true);
                  }}
                >
                  <Plus size={16} /> Add Application
                </Button>
              </div>

              <Table
                columns={[
                  {
                    key: "charity_type",
                    title: "Type",
                    render: (row) => row.charity_type || "-",
                  },
                  {
                    key: "amount",
                    title: "Amount",
                    render: (row) => formatCurrency(row.amount || 0),
                  },
                  {
                    key: "item_name",
                    title: "Item",
                    render: (row) => row.item_name || "-",
                  },
                  {
                    key: "quantity",
                    title: "Qty",
                    render: (row) => row.quantity || 0,
                  },
                  {
                    key: "charity_date",
                    title: "Date",
                    render: (row) => formatDate(row.charity_date),
                  },
                  {
                    key: "note",
                    title: "Note",
                    render: (row) => row.note || "-",
                  },
                ]}
                data={selectedCharityHistory}
                emptyText="No charity history found"
              />
            </div>
          </>
        )}
      </Modal>

      <Modal
        open={charityRecordModalOpen}
        title={`Add Charity - ${selectedCharity?.charity_name || ""}`}
        onClose={() => {
          setCharityRecordModalOpen(false);
          resetCharityRecordForm();
        }}
        size="md"
      >
        <form onSubmit={createCharityForSelectedProfile}>
          <Input
            label="Charity Type"
            name="charityType"
            value={charityRecordForm.charityType}
            onChange={handleChange(setCharityRecordForm)}
          />

          <Input
            label="Amount"
            name="amount"
            type="number"
            value={charityRecordForm.amount}
            onChange={handleChange(setCharityRecordForm)}
          />

          <Input
            label="Item Name"
            name="itemName"
            value={charityRecordForm.itemName}
            onChange={handleChange(setCharityRecordForm)}
          />

          <Input
            label="Quantity"
            name="quantity"
            type="number"
            value={charityRecordForm.quantity}
            onChange={handleChange(setCharityRecordForm)}
          />

          <Input
            label="Charity Date"
            name="charityDate"
            type="date"
            value={charityRecordForm.charityDate}
            onChange={handleChange(setCharityRecordForm)}
          />

          <Input
            label="Note"
            name="note"
            value={charityRecordForm.note}
            onChange={handleChange(setCharityRecordForm)}
          />

          <div className="modal-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setCharityRecordModalOpen(false);
                resetCharityRecordForm();
              }}
            >
              Cancel
            </Button>

            <Button type="submit" loading={saving}>
              Save Charity
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteModal
        open={charityDeleteModalOpen}
        title="Delete Beneficiary"
        message={`Are you sure you want to delete ${selectedCharity?.charity_name || "this beneficiary"
          }?`}
        loading={deleting}
        onClose={() => setCharityDeleteModalOpen(false)}
        onConfirm={confirmDeleteCharity}
      />

      <Modal
        open={donationModalOpen}
        title={selectedDonation?.id ? "Edit Donation" : "Add Donation"}
        onClose={() => {
          setDonationModalOpen(false);
          setSelectedDonation(null);
          resetDonationForm();
        }}
        size="md"
      >
        <form onSubmit={saveDonation}>
          <Input
            label="Name"
            name="name"
            value={donationForm.name}
            onChange={handleDonationNameChange}
            placeholder="Search existing donor or type new donor"
            list="donor-name-list"
            required
          />

          <datalist id="donor-name-list">
            {donors.map((donor) => (
              <option key={donor.id} value={donor.full_name} />
            ))}
          </datalist>

          <Input
            label="Contact"
            name="contact"
            value={donationForm.contact}
            onChange={handleChange(setDonationForm)}
          // disabled={Boolean(donationForm.donorId)}
          />

          <Input
            label="Amount"
            name="amount"
            type="number"
            value={donationForm.amount}
            onChange={handleChange(setDonationForm)}
            required
          />

          <Select
            label="Method"
            name="methodId"
            value={donationForm.methodId}
            onChange={handleChange(setDonationForm)}
            options={donationMethods.map((method) => ({
              label: method.method_name,
              value: method.id,
            }))}
            required
          />

          <Input
            label="Date"
            name="date"
            type="date"
            value={donationForm.date}
            onChange={handleChange(setDonationForm)}
          />

          <div className="modal-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setDonationModalOpen(false);
                setSelectedDonation(null);
                resetDonationForm();
              }}
            >
              Cancel
            </Button>

            <Button type="submit" loading={saving}>
              {selectedDonation?.id ? "Update Donation" : "Save Donation"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={donationViewModalOpen}
        title="Donation Details"
        onClose={() => {
          setDonationViewModalOpen(false);
          setSelectedDonation(null);
        }}
        size="md"
      >
        {selectedDonation && (
          <div className="welfare-detail-grid">
            <div>
              <strong>Name:</strong>
              <p>{selectedDonation.name || selectedDonation.donor_name || "-"}</p>
            </div>

            <div>
              <strong>Contact:</strong>
              <p>{selectedDonation.contact || "-"}</p>
            </div>

            <div>
              <strong>Amount:</strong>
              <p>{formatCurrency(selectedDonation.amount)}</p>
            </div>

            <div>
              <strong>Method:</strong>
              <p>{selectedDonation.method || selectedDonation.donation_method || "-"}</p>
            </div>

            <div>
              <strong>Date:</strong>
              <p>{formatDate(selectedDonation.donation_date)}</p>
            </div>

            <div>
              <strong>Created By:</strong>
              <p>{selectedDonation.created_by_name || "-"}</p>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDeleteModal
        open={donationDeleteModalOpen}
        title="Delete Donation"
        message={`Are you sure you want to delete donation amount ${selectedDonation?.amount ? formatCurrency(selectedDonation.amount) : ""
          }?`}
        loading={deleting}
        onClose={() => setDonationDeleteModalOpen(false)}
        onConfirm={confirmDeleteDonation}
      />

      <Modal
        open={applicationModalOpen}
        title={selectedApplication?.id ? "Edit Welfare Application" : "Add Welfare Application"}
        onClose={() => {
          setApplicationModalOpen(false);
          setSelectedApplication(null);
          resetApplicationForm();
        }}
        size="lg"
      >
        <form onSubmit={saveApplication}>
          <div className="welfare-form-grid">
            <Input label="Applicant Name" name="applicantName" value={applicationForm.applicantName} onChange={handleChange(setApplicationForm)} required />
            <Input label="Father Name" name="fatherName" value={applicationForm.fatherName} onChange={handleChange(setApplicationForm)} />
            <Input label="Phone" name="phone" value={applicationForm.phone} onChange={handleChange(setApplicationForm)} />
            <Input label="CNIC" name="cnic" value={applicationForm.cnic} onChange={handleChange(setApplicationForm)} />

            <Select
              label="Gender"
              name="gender"
              value={applicationForm.gender}
              onChange={handleChange(setApplicationForm)}
              options={[
                { label: "Male", value: "male" },
                { label: "Female", value: "female" },
                { label: "Other", value: "other" },
              ]}
            />

            <Select
              label="Marital Status"
              name="maritalStatus"
              value={applicationForm.maritalStatus}
              onChange={handleChange(setApplicationForm)}
              options={[
                { label: "Single", value: "single" },
                { label: "Married", value: "married" },
                { label: "Widowed", value: "widowed" },
              ]}
            />

            <Input label="Family Members" name="familyMembers" type="number" value={applicationForm.familyMembers} onChange={handleChange(setApplicationForm)} />
            {/* <Input label="Residence Type" name="residenceType" value={applicationForm.residenceType} onChange={handleChange(setApplicationForm)} />
            <Input label="Education Level" name="educationLevel" value={applicationForm.educationLevel} onChange={handleChange(setApplicationForm)} /> */}
            <Input label="Monthly Income" name="monthlyIncome" type="number" value={applicationForm.monthlyIncome} onChange={handleChange(setApplicationForm)} />
            <Input label="Monthly Expense" name="monthlyExpense" type="number" value={applicationForm.monthlyExpense} onChange={handleChange(setApplicationForm)} />
            {/* <Input label="Support Type" name="supportType" value={applicationForm.supportType} onChange={handleChange(setApplicationForm)} /> */}
            <Input label="Requested Amount" name="requestedAmount" type="number" value={applicationForm.requestedAmount} onChange={handleChange(setApplicationForm)} />
          </div>

          <Input label="Address" name="address" value={applicationForm.address} onChange={handleChange(setApplicationForm)} />
          <Input label="Verification Notes" name="verificationNotes" value={applicationForm.verificationNotes} onChange={handleChange(setApplicationForm)} />

          <hr style={{ margin: "18px 0", border: "none", borderTop: "1px solid var(--border)" }} />

          <h3 style={{ marginBottom: "12px" }}>Education Help Details</h3>

          <div className="welfare-form-grid">
            <Input
              label="Area / Mohalla"
              name="area"
              value={applicationForm.area}
              onChange={handleChange(setApplicationForm)}
            />

            <Select
              label="House Status"
              name="houseStatus"
              value={applicationForm.houseStatus}
              onChange={handleChange(setApplicationForm)}
              options={[
                { label: "Own House", value: "own" },
                { label: "Rented House", value: "rented" },
              ]}
            />

            <Input
              label="Community / Biradari"
              name="community"
              value={applicationForm.community}
              onChange={handleChange(setApplicationForm)}
            />

            <Input
              label="School Name"
              name="schoolName"
              value={applicationForm.schoolName}
              onChange={handleChange(setApplicationForm)}
            />

            <Input
              label="Verifier Name"
              name="verifierName"
              value={applicationForm.verifierName}
              onChange={handleChange(setApplicationForm)}
            />

            <Input
              label="Office Remarks"
              name="officeRemarks"
              value={applicationForm.officeRemarks}
              onChange={handleChange(setApplicationForm)}
            />
          </div>

          <div className="form-group">
            <label>Need Description</label>
            <textarea
              name="needDescription"
              value={applicationForm.needDescription}
              onChange={handleChange(setApplicationForm)}
              placeholder="Explain what help is required"
              rows="3"
            />
          </div>

          <div className="education-help-box">
            <label>
              <input
                type="checkbox"
                name="needsSchoolFee"
                checked={applicationForm.needsSchoolFee}
                onChange={handleChange(setApplicationForm)}
              />
              School Fee
            </label>

            <label>
              <input
                type="checkbox"
                name="needsSchoolDress"
                checked={applicationForm.needsSchoolDress}
                onChange={handleChange(setApplicationForm)}
              />
              School Dress
            </label>

            <label>
              <input
                type="checkbox"
                name="needsSchoolUniform"
                checked={applicationForm.needsSchoolUniform}
                onChange={handleChange(setApplicationForm)}
              />
              School Uniform
            </label>

            <label>
              <input
                type="checkbox"
                name="needsSchoolBag"
                checked={applicationForm.needsSchoolBag}
                onChange={handleChange(setApplicationForm)}
              />
              School Bag
            </label>

            <label>
              <input
                type="checkbox"
                name="needsSchoolShoes"
                checked={applicationForm.needsSchoolShoes}
                onChange={handleChange(setApplicationForm)}
              />
              School Shoes
            </label>

            <label>
              <input
                type="checkbox"
                name="needsUniversityFee"
                checked={applicationForm.needsUniversityFee}
                onChange={handleChange(setApplicationForm)}
              />
              University Fee
            </label>

            <label>
              <input
                type="checkbox"
                name="needsOtherEducationHelp"
                checked={applicationForm.needsOtherEducationHelp}
                onChange={handleChange(setApplicationForm)}
              />
              Other Education Help
            </label>
          </div>
          <div className="modal-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setApplicationModalOpen(false);
                setSelectedApplication(null);
                resetApplicationForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {selectedApplication?.id ? "Update Application" : "Save Application"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={applicationViewModalOpen}
        title="Application Details"
        onClose={() => {
          setApplicationViewModalOpen(false);
          setSelectedApplication(null);
        }}
        size="lg"
      >
        {selectedApplication && (
          <div className="welfare-detail-grid">
            <div><strong>Applicant:</strong><p>{selectedApplication.applicant_name || "-"}</p></div>
            <div><strong>Father Name:</strong><p>{selectedApplication.father_name || "-"}</p></div>
            <div><strong>Phone:</strong><p>{selectedApplication.phone || "-"}</p></div>
            <div><strong>CNIC:</strong><p>{selectedApplication.cnic || "-"}</p></div>
            <div><strong>Gender:</strong><p>{selectedApplication.gender || "-"}</p></div>
            <div><strong>Marital Status:</strong><p>{selectedApplication.marital_status || "-"}</p></div>
            <div><strong>Family Members:</strong><p>{selectedApplication.family_members || 0}</p></div>
            {/* <div><strong>Residence Type:</strong><p>{selectedApplication.residence_type || "-"}</p></div>
            <div><strong>Education Level:</strong><p>{selectedApplication.education_level || "-"}</p></div> */}
            <div><strong>Monthly Income:</strong><p>{formatCurrency(selectedApplication.monthly_income || 0)}</p></div>
            <div><strong>Monthly Expense:</strong><p>{formatCurrency(selectedApplication.monthly_expense || 0)}</p></div>
            {/* <div><strong>Support Type:</strong><p>{selectedApplication.support_type || "-"}</p></div> */}
            <div><strong>Requested Amount:</strong><p>{formatCurrency(selectedApplication.requested_amount || 0)}</p></div>
            <div><strong>Approved Amount:</strong><p>{formatCurrency(selectedApplication.approved_amount || 0)}</p></div>
            <div><strong>Status:</strong><p>{selectedApplication.case_status || "-"}</p></div>
            <div><strong>Address:</strong><p>{selectedApplication.address || "-"}</p></div>
            <div><strong>Verification Notes:</strong><p>{selectedApplication.verification_notes || "-"}</p></div>
            <div><strong>Area / Mohalla:</strong><p>{selectedApplication.area || "-"}</p></div>
            <div><strong>House Status:</strong><p>{selectedApplication.house_status || "-"}</p></div>
            <div><strong>Community / Biradari:</strong><p>{selectedApplication.community || "-"}</p></div>
            <div><strong>Need Description:</strong><p>{selectedApplication.need_description || "-"}</p></div>
            <div><strong>School Name:</strong><p>{selectedApplication.school_name || "-"}</p></div>
            <div><strong>Verifier Name:</strong><p>{selectedApplication.verifier_name || "-"}</p></div>
            <div><strong>Office Remarks:</strong><p>{selectedApplication.office_remarks || "-"}</p></div>

            <div>
              <strong>Required Education Help:</strong>
              <p>
                {[
                  selectedApplication.needs_school_fee && "School Fee",
                  selectedApplication.needs_school_dress && "School Dress",
                  selectedApplication.needs_school_uniform && "School Uniform",
                  selectedApplication.needs_school_bag && "School Bag",
                  selectedApplication.needs_school_shoes && "School Shoes",
                  selectedApplication.needs_university_fee && "University Fee",
                  selectedApplication.needs_other_education_help && "Other Education Help",
                ]
                  .filter(Boolean)
                  .join(", ") || "-"}
              </p>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDeleteModal
        open={applicationDeleteModalOpen}
        title="Delete Application"
        message={`Are you sure you want to delete ${selectedApplication?.applicant_name || "this application"
          }?`}
        loading={deleting}
        onClose={() => setApplicationDeleteModalOpen(false)}
        onConfirm={confirmDeleteApplication}
      />

      <Modal
        open={statusModalOpen}
        title="Update Application Status"
        onClose={() => setStatusModalOpen(false)}
        size="md"
      >
        <form onSubmit={updateApplicationStatus}>
          <Select
            label="Status"
            name="caseStatus"
            value={statusForm.caseStatus}
            onChange={handleChange(setStatusForm)}
            options={[
              { label: "Approved", value: "approved" },
              { label: "Rejected", value: "rejected" },
              { label: "Completed", value: "completed" },
              { label: "Pending", value: "pending" },
            ]}
          />

          <Input label="Approved Amount" name="approvedAmount" type="number" value={statusForm.approvedAmount} onChange={handleChange(setStatusForm)} />

          <Input label="Verification Notes" name="verificationNotes" value={statusForm.verificationNotes} onChange={handleChange(setStatusForm)} />

          <div className="modal-actions">
            <Button type="button" variant="secondary" onClick={() => setStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Update Status
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default WelfareDashboard;