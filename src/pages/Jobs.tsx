import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, MapPin, Clock, X, Users, Briefcase, DollarSign } from 'lucide-react';
import Swal from "sweetalert2";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";

// === API Base URLs ===
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  type: string;
  experience: string;
  salary: string;
  salaryCurrency: string;
  description: string;
  gender: string;
  createdAt: string;
  companyLogo?: string;
  industry?: string;
  industryImage?: string;
}

interface ApplicationFormData {
  fullName: string;
  email: string;
  phone: string;
  countryCode: string;
  country: string;
  age: string;
  gender: string;
  experience: string;
}

interface ValidationErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  country?: string;
  age?: string;
  gender?: string;
  experience?: string;
}

const Jobs: React.FC = () => {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    experience: '',
    gender: '',
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [applicationData, setApplicationData] = useState<ApplicationFormData>({
    fullName: '',
    email: '',
    phone: '',
    countryCode: '+971',
    country: '',
    age: '',
    gender: '',
    experience: '',
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch(`${API_BASE}/jobs`);
        if (!res.ok) {
          console.error("Failed to fetch jobs, status:", res.status);
          setJobs([]);
          return;
        }
        const data = await res.json();
        setJobs(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching jobs:", err);
        setJobs([]);
      }
    };
    fetchJobs();
  }, []);

  const jobTypes = [...new Set(jobs.map(job => job.type))];
  const experienceLevels = [...new Set(jobs.map(job => job.experience))];
  const genderPreferences = [...new Set(jobs.map(job => job.gender).filter(Boolean))];
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [passportFile, setPassportFile] = useState<File | null>(null);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch =
          job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.location.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = !filters.type || job.type === filters.type;
      const matchesExperience = !filters.experience || job.experience === filters.experience;
      const matchesGender = !filters.gender || job.gender === filters.gender;

      return matchesSearch && matchesType && matchesExperience && matchesGender;
    });
  }, [jobs, searchTerm, filters]);

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!applicationData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (/\d/.test(applicationData.fullName)) {
      newErrors.fullName = 'Full name cannot contain numbers';
    } else if (applicationData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    if (!applicationData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applicationData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!applicationData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d+$/.test(applicationData.phone)) {
      newErrors.phone = 'Phone number must contain only digits';
    } else if (applicationData.phone.length < 7 || applicationData.phone.length > 15) {
      newErrors.phone = 'Phone number must be between 7 and 15 digits';
    }

    if (!applicationData.country.trim()) {
      newErrors.country = 'Country is required';
    }

    if (!applicationData.age) {
      newErrors.age = 'Age is required';
    } else if (parseInt(applicationData.age) < 18 || parseInt(applicationData.age) > 100) {
      newErrors.age = 'Age must be between 18 and 100';
    }

    if (!applicationData.gender) {
      newErrors.gender = 'Gender is required';
    }

    if (!applicationData.experience.trim()) {
      newErrors.experience = 'Experience is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleApplyClick = (job: Job) => {
    setSelectedJob(job);
    setIsApplicationModalOpen(true);
    setErrors({});
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ type: '', experience: '', gender: '' });
    setSearchTerm('');
  };

  const handleApplicationSubmit = async () => {
    if (!selectedJob) return;
    if (!validateForm()) return;

    if (!resumeFile) {
      Swal.fire({
        title: "Resume Required",
        text: "Please upload your resume to continue",
        icon: "warning",
        confirmButtonColor: "#DC2626"
      });
      return;
    }

    // Show loading indicator
    Swal.fire({
      title: "Submitting Application...",
      text: "Please wait while we upload your documents",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      // 🚀 Upload BOTH files in parallel (much faster!)
      const uploadPromises = [];

      // Resume upload
      const resumeForm = new FormData();
      resumeForm.append("resume", resumeFile);
      uploadPromises.push(
          fetch(`${API_BASE}/upload/resume`, {
            method: "POST",
            body: resumeForm,
          }).then(res => res.json())
      );

      // Passport upload (if exists)
      if (passportFile) {
        const passportForm = new FormData();
        passportForm.append("passportCopy", passportFile);
        uploadPromises.push(
            fetch(`${API_BASE}/upload/passport`, {
              method: "POST",
              body: passportForm,
            }).then(res => res.json())
        );
      } else {
        uploadPromises.push(Promise.resolve(null));
      }

      // Wait for both uploads to complete
      const [resumeData, passportData] = await Promise.all(uploadPromises);

      const uploadedResumeUrl = resumeData?.url || "";
      const uploadedPassportUrl = passportData?.url || "";

      // Submit application to database
      const res = await fetch(`${API_BASE}/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: selectedJob.id,
          fullName: applicationData.fullName,
          email: applicationData.email,
          phone: `${applicationData.countryCode} ${applicationData.phone}`,
          country: applicationData.country,
          age: applicationData.age,
          gender: applicationData.gender,
          experience: applicationData.experience,
          resume: uploadedResumeUrl,
          passportCopy: uploadedPassportUrl,
        }),
      });

      if (!res.ok) throw new Error("Failed to submit application");

      Swal.fire({
        title: "Application Successful!",
        text: "Your application has been submitted successfully!",
        icon: "success",
        confirmButtonColor: "#1E3A8A",
        timer: 2500
      });

      setIsApplicationModalOpen(false);
      setApplicationData({
        fullName: "",
        email: "",
        phone: "",
        countryCode: "+971",
        country: "",
        age: "",
        gender: "",
        experience: "",
      });
      setResumeFile(null);
      setPassportFile(null);
      setErrors({});
    } catch (err) {
      console.error("Error submitting application:", err);
      Swal.fire({
        title: "Submission Failed",
        text: "There was an error submitting your application. Please try again.",
        icon: "error",
        confirmButtonColor: "#DC2626",
      });
    }
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setApplicationData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  const getCompanyInitials = (companyName: string): string => {
    return companyName
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('');
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Recently';
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-4">
              Career Opportunities
            </h1>
            <p className="text-xl text-gray-600">
              Discover <span className="font-bold text-blue-600">{jobs.length}</span> exciting positions across the UAE
            </p>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search jobs, companies, or keywords..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all font-medium"
              >
                <Filter className="h-5 w-5 mr-2" />
                Filters
                {activeFiltersCount > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-600 rounded-full">
                  {activeFiltersCount}
                </span>
                )}
              </button>

              {activeFiltersCount > 0 && (
                  <button
                      onClick={clearFilters}
                      className="inline-flex items-center px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all font-medium"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear All
                  </button>
              )}
            </div>

            {isFilterOpen && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <Clock className="inline h-4 w-4 mr-1" />
                        Job Type
                      </label>
                      <select
                          value={filters.type}
                          onChange={(e) => handleFilterChange('type', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">All Types</option>
                        {jobTypes.map((type) => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <Briefcase className="inline h-4 w-4 mr-1" />
                        Experience Level
                      </label>
                      <select
                          value={filters.experience}
                          onChange={(e) => handleFilterChange('experience', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">All Levels</option>
                        {experienceLevels.map((level) => (
                            <option key={level} value={level}>{level}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <Users className="inline h-4 w-4 mr-1" />
                        Gender
                      </label>
                      <select
                          value={filters.gender}
                          onChange={(e) => handleFilterChange('gender', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">All</option>
                        {genderPreferences.map((g) => (
                            <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
            )}
          </div>

          {/* Results Summary */}
          <div className="flex justify-between items-center mb-8 px-2">
            <p className="text-gray-600 text-lg">
              Showing <span className="font-bold text-gray-900">{filteredJobs.length}</span> of{" "}
              <span className="font-bold text-gray-900">{jobs.length}</span> positions
            </p>
          </div>

          {/* Job Listings */}
          {filteredJobs.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredJobs.map((job) => (
                    <div key={job.id} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200 transform hover:-translate-y-1 flex flex-col">
                      <div className="bg-gradient-to-r from-blue-600 to-blue-700 h-2"></div>

                      {/* Company Header */}
                      <div className="p-6 pb-4 bg-gradient-to-b from-blue-50/50 to-transparent">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center bg-gray-100 shadow-md">
                            {job.industryImage ? (
                                <img
                                    src={job.industryImage} //  Remove FILE_BASE, use direct URL
                                    alt={job.industry || job.company}
                                    className="w-full h-full object-cover rounded-xl"
                                />
                            ) : (
                                <span className="text-blue-600 font-bold text-lg">
        {getCompanyInitials(job.company)}
    </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 text-sm truncate">{job.company}</h4>
                            <p className="text-xs text-gray-500">{job.industry || "Industry not specified"}</p>
                          </div>
                          {job.gender && (
                              <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold flex-shrink-0">
                                {job.gender}
                              </span>
                          )}
                        </div>

                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-xl font-bold text-gray-900 leading-tight flex-1">{job.title}</h3>
                          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0">
                            {job.type}
                          </span>
                        </div>
                      </div>

                      <div className="px-6 pb-4 flex-1 flex flex-col">
                        <div className="space-y-2.5 mb-4">
                          <div className="flex items-center text-gray-600">
                            <MapPin className="w-4 h-4 mr-2 text-red-500 flex-shrink-0" />
                            <span className="text-sm">{job.location}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Briefcase className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" />
                            <span className="text-sm">{job.experience}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <DollarSign className="w-4 h-4 mr-2 text-yellow-500 flex-shrink-0" />
                            <span className="text-sm font-semibold text-green-600">{job.salaryCurrency || 'AED'} {job.salary}</span>
                          </div>
                          <div className="flex items-center text-gray-500">
                            <Clock className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                            <span className="text-xs">Posted {formatDate(job.createdAt)}</span>
                          </div>
                        </div>

                        <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed flex-1">{job.description}</p>

                        <div className="flex items-center gap-2 mb-4">
                          <span className="inline-flex items-center px-2 py-1 bg-yellow-50 text-yellow-700 rounded-md text-xs font-medium border border-yellow-200">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            Featured Position
                          </span>
                        </div>
                      </div>

                      <div className="px-6 pb-6 mt-auto">
                        <button
                            onClick={() => handleApplyClick(job)}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
                        >
                          Apply Now
                        </button>
                      </div>
                    </div>
                ))}
              </div>
          ) : (
              <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No jobs found</h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your search criteria or clearing the filters
                </p>
                <button
                    onClick={clearFilters}
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-md"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </button>
              </div>
          )}
        </div>

        {/* Application Modal */}
        {isApplicationModalOpen && selectedJob && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
              <div className="bg-white rounded-2xl max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-6 rounded-t-2xl z-10">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-bold">Apply for {selectedJob.title}</h2>
                      <p className="text-blue-100 mt-1">{selectedJob.company}</p>
                    </div>
                    <button
                        onClick={() => {
                          setIsApplicationModalOpen(false);
                          setErrors({});
                        }}
                        className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <div className="p-8 space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="fullName"
                        placeholder="John Doe"
                        value={applicationData.fullName}
                        onChange={handleInputChange}
                        className={`w-full border ${errors.fullName ? 'border-red-500' : 'border-gray-300'} p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    />
                    {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="email"
                        name="email"
                        placeholder="john.doe@example.com"
                        value={applicationData.email}
                        onChange={handleInputChange}
                        className={`w-full border ${errors.email ? 'border-red-500' : 'border-gray-300'} p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    />
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className={`border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-xl`}>
                      <PhoneInput
                          defaultCountry="ae"
                          value={`${applicationData.countryCode}${applicationData.phone}`}
                          onChange={(phone, meta) => {
                            const dialCode = `+${meta.country.dialCode}`;
                            const localNumber = phone.replace(dialCode, '').trim();

                            setApplicationData({
                              ...applicationData,
                              phone: localNumber,
                              countryCode: dialCode,
                              country: meta.country.name,
                            });
                          }}
                          inputStyle={{
                            width: '100%',
                            border: 'none',
                            padding: '12px',
                            fontSize: '14px',
                            borderRadius: '0.75rem',
                          }}
                          countrySelectorStyleProps={{
                            buttonStyle: {
                              border: 'none',
                              borderRight: '1px solid #e5e7eb',
                              backgroundColor: 'transparent',
                              padding: '12px',
                            },
                            dropdownStyleProps: {
                              style: {
                                zIndex: 9999,
                              }
                            }
                          }}
                      />
                    </div>
                    {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Country <span className="text-red-500">*</span>
                      </label>
                      <input
                          type="text"
                          name="country"
                          placeholder="United Arab Emirates"
                          value={applicationData.country}
                          onChange={handleInputChange}
                          className={`w-full border ${errors.country ? 'border-red-500' : 'border-gray-300'} p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      />
                      {errors.country && <p className="text-red-500 text-sm mt-1">{errors.country}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Age <span className="text-red-500">*</span>
                      </label>
                      <input
                          type="number"
                          name="age"
                          placeholder="25"
                          value={applicationData.age}
                          onChange={handleInputChange}
                          onKeyPress={(e) => {
                            if (!/\d/.test(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          min="18"
                          max="100"
                          className={`w-full border ${errors.age ? 'border-red-500' : 'border-gray-300'} p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      />
                      {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Gender <span className="text-red-500">*</span>
                      </label>
                      <select
                          name="gender"
                          value={applicationData.gender}
                          onChange={handleInputChange}
                          className={`w-full border ${errors.gender ? 'border-red-500' : 'border-gray-300'} p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                      {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Experience <span className="text-red-500">*</span>
                      </label>
                      <input
                          type="text"
                          name="experience"
                          placeholder="e.g., 3 years in Sales"
                          value={applicationData.experience}
                          onChange={handleInputChange}
                          className={`w-full border ${errors.experience ? 'border-red-500' : 'border-gray-300'} p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      />
                      {errors.experience && <p className="text-red-500 text-sm mt-1">{errors.experience}</p>}
                    </div>
                  </div>

                  {/* File Upload Section */}
                  <div className="mt-6 space-y-5 pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Upload Documents</h3>

                    {/* Resume Upload */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Upload your Resume <span className="text-red-500">*</span>
                      </label>
                      <input
                          type="file"
                          name="resume"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                          required
                          className="w-full border border-gray-300 rounded-xl p-3 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 hover:bg-gray-100"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Accepted formats: .pdf, .doc, .docx (Max 5MB)
                      </p>
                    </div>

                    {/* Passport Upload */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Upload your Passport Copy <span className="text-gray-400">(optional)</span>
                      </label>
                      <input
                          type="file"
                          name="passportCopy"
                          accept=".jpg,.jpeg,.png,.pdf"
                          onChange={(e) => setPassportFile(e.target.files?.[0] || null)}
                          className="w-full border border-gray-300 rounded-xl p-3 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 hover:bg-gray-100"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Accepted formats: .jpg, .jpeg, .png, .pdf (Max 3MB)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="sticky bottom-0 bg-gray-50 px-8 py-6 rounded-b-2xl border-t border-gray-200 flex justify-end gap-4">
                  <button
                      onClick={() => {
                        setIsApplicationModalOpen(false);
                        setErrors({});
                      }}
                      className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-100 transition-all font-medium"
                  >
                    Cancel
                  </button>
                  <button
                      onClick={handleApplicationSubmit}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-semibold shadow-md"
                  >
                    Submit Application
                  </button>
                </div>
              </div>
            </div>
        )}
      </div>
  );
};

export default Jobs;