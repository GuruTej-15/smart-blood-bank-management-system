import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Droplets } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Field, TextInput, Select, PrimaryButton } from "../components/Form";
import { BLOOD_GROUPS, getLandingPath } from "../utils/constants";

const VALIDATION_RULES = {
  validateEmail: (email) => {
    if (!email) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) return "Please provide a valid email address";
    if (email.length > 254) return "Email address is too long";
    const [localPart, domain] = email.split("@");
    if (!localPart || localPart.length > 64) return "Invalid email address";
    if (!/^[a-zA-Z0-9._%-]+$/.test(localPart)) return "Email contains invalid characters";
    if (domain.toLowerCase().includes("..")) return "Invalid email domain";
    return null;
  },
  validatePhone: (phone) => {
    if (!phone) return "Phone number is required";
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    if (cleanPhone.length !== 10) return "Phone number must be exactly 10 digits";
    if (!/^[6-9][0-9]{9}$/.test(cleanPhone)) return "Phone must start with 6-9";
    return null;
  },
  validateName: (name) => {
    if (!name) return "Name is required";
    if (name.length < 2 || name.length > 80) return "Name must be 2-80 characters";
    if (!/^[A-Za-z ]+$/.test(name)) return "Name can only contain letters and spaces";
    return null;
  },
  validateHospitalName: (name) => {
    if (!name) return "Hospital name is required";
    if (name.length < 3 || name.length > 100) return "Hospital name must be 3-100 characters";
    return null;
  },
  validateContactNumber: (contact) => {
    if (!contact) return "Contact number is required";
    const cleanContact = contact.replace(/[^0-9+]/g, "");
    if (cleanContact.length < 8 || cleanContact.length > 15) return "Contact must be 8-15 digits";
    if (!/^\+?[0-9]{8,15}$/.test(cleanContact)) return "Contact number must contain only digits";
    return null;
  },
};

export default function Register() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "donor",
    phone: "",
    bloodGroup: "O+",
    hospitalName: "",
    contactNumber: "",
    adminCode: "",
  });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  const passwordStrength = useMemo(() => {
    const value = form.password;
    if (!value) return { label: "Enter a password", color: "text-muted" };
    if (value.length < 8) return { label: "Too short", color: "text-pulse" };
    const checks = [/[A-Z]/, /[a-z]/, /\d/, /[^A-Za-z0-9]/].filter((regex) => regex.test(value));
    if (checks.length < 4) return { label: "Needs more complexity", color: "text-pulse" };
    return { label: "Strong", color: "text-vital" };
  }, [form.password]);

  const handleFieldChange = (field, value) => {
    setForm({ ...form, [field]: value });
    setTouched({ ...touched, [field]: true });
    
    const newErrors = { ...fieldErrors };
    if (value) {
      if (field === "email") {
        newErrors.email = VALIDATION_RULES.validateEmail(value);
      } else if (field === "phone") {
        newErrors.phone = VALIDATION_RULES.validatePhone(value);
      } else if (field === "name") {
        newErrors.name = VALIDATION_RULES.validateName(value);
      } else if (field === "hospitalName") {
        newErrors.hospitalName = VALIDATION_RULES.validateHospitalName(value);
      } else if (field === "contactNumber") {
        newErrors.contactNumber = VALIDATION_RULES.validateContactNumber(value);
      }
    } else {
      delete newErrors[field];
    }
    setFieldErrors(newErrors);
  };

  const handleRoleChange = (newRole) => {
    setForm({ ...form, role: newRole });
    setFieldErrors({});
    setTouched({});
  };

  const getVisibleErrors = () => {
    const visibleErrors = {};
    for (const [key, value] of Object.entries(fieldErrors)) {
      if (touched[key]) {
        visibleErrors[key] = value;
      }
    }
    return visibleErrors;
  };

  const validateForm = () => {
    const errors = {};
    errors.name = VALIDATION_RULES.validateName(form.name);
    errors.email = VALIDATION_RULES.validateEmail(form.email);

    if (form.role === "donor") {
      errors.phone = VALIDATION_RULES.validatePhone(form.phone);
    }

    if (form.role === "hospital") {
      errors.hospitalName = VALIDATION_RULES.validateHospitalName(form.hospitalName);
      errors.contactNumber = VALIDATION_RULES.validateContactNumber(form.contactNumber);
    }

    const filteredErrors = Object.fromEntries(Object.entries(errors).filter(([, v]) => v));
    setFieldErrors(filteredErrors);
    return Object.keys(filteredErrors).length === 0;
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    try {
      const result = await register(form);
      navigate(getLandingPath(result.role));
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-crimson text-white">
            <Droplets size={24} />
          </div>
          <h1 className="font-display text-2xl font-semibold text-ink">Create an account</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-stone bg-white p-6 shadow-sm">
          {error && <p className="rounded-lg bg-pulse-light px-3 py-2 text-sm text-pulse">{error}</p>}
          
          <Field label="Full name">
            <TextInput 
              required 
              value={form.name} 
              onChange={(e) => handleFieldChange("name", e.target.value)}
              aria-invalid={!!fieldErrors.name}
            />
            {touched.name && fieldErrors.name && <p className="mt-1 text-xs text-pulse">{fieldErrors.name}</p>}
          </Field>

          <Field label="Email">
            <TextInput
              type="email"
              required
              value={form.email}
              onChange={(e) => handleFieldChange("email", e.target.value)}
              aria-invalid={!!fieldErrors.email}
            />
            {touched.email && fieldErrors.email && <p className="mt-1 text-xs text-pulse">{fieldErrors.email}</p>}
          </Field>

          <Field label="Password">
            <TextInput
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <p className={`mt-1 text-xs ${passwordStrength.color}`}>{passwordStrength.label}</p>
          </Field>

          <Field label="Role">
            <Select value={form.role} onChange={(e) => handleRoleChange(e.target.value)}>
              <option value="donor">Donor</option>
              <option value="hospital">Hospital staff</option>
              <option value="admin">Blood bank admin</option>
            </Select>
          </Field>

          {form.role === "donor" && (
            <>
              <Field label="Phone">
                <TextInput
                  required
                  value={form.phone}
                  onChange={(e) => handleFieldChange("phone", e.target.value)}
                  placeholder="10-digit Indian mobile number"
                  aria-invalid={!!fieldErrors.phone}
                />
                {touched.phone && fieldErrors.phone && <p className="mt-1 text-xs text-pulse">{fieldErrors.phone}</p>}
              </Field>
              <Field label="Blood group">
                <Select value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}>
                  {BLOOD_GROUPS.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </Select>
              </Field>
            </>
          )}

          {form.role === "hospital" && (
            <>
              <Field label="Hospital name">
                <TextInput
                  required
                  value={form.hospitalName}
                  onChange={(e) => handleFieldChange("hospitalName", e.target.value)}
                  aria-invalid={!!fieldErrors.hospitalName}
                />
                {touched.hospitalName && fieldErrors.hospitalName && <p className="mt-1 text-xs text-pulse">{fieldErrors.hospitalName}</p>}
              </Field>
              <Field label="Contact number">
                <TextInput
                  required
                  value={form.contactNumber}
                  onChange={(e) => handleFieldChange("contactNumber", e.target.value)}
                  aria-invalid={!!fieldErrors.contactNumber}
                />
                {touched.contactNumber && fieldErrors.contactNumber && <p className="mt-1 text-xs text-pulse">{fieldErrors.contactNumber}</p>}
              </Field>
            </>
          )}

          {form.role === "admin" && (
            <Field label="Admin invite code">
              <TextInput
                required
                value={form.adminCode}
                onChange={(e) => setForm({ ...form, adminCode: e.target.value })}
              />
            </Field>
          )}

          <PrimaryButton type="submit" disabled={loading} className="w-full">
            {loading ? "Creating account…" : "Create account"}
          </PrimaryButton>
        </form>

        <p className="mt-4 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-crimson hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
