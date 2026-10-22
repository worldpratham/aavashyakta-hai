import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  API_BASE_URL,
  normalizeProfile,
  type Profile,
  type Role,
} from "@/lib/api";

interface MongoSession {
  user: {
    id: string;
    email: string;
  };
}

export interface SignUpPayload {
  email: string;
  password: string;
  fullName: string;
  role: Role;
  phone?: string;
  location?: string;
  company_name?: string;
  company_type?: string;
  gst_or_id?: string;
  aadhaar_number?: string;
  aadhaar_verified?: boolean;
  bank_details?: {
    account_holder_name?: string;
    account_number?: string;
    ifsc_code?: string;
    bank_name?: string;
  };
  payment_mode?: string;
  upi_id?: string;
  terms_accepted?: boolean;
  avatar_url?: string;
  profileImage?: string;
  primary_skill?: string;
  experience_level?: string;
  skills?: string[];
}

export interface SignInResult {
  error: string | null;
  roleMismatch?: boolean;
  targetRole?: Role;
  message?: string;
  user?: Profile;
}

interface AuthState {
  session: MongoSession | null;
  profile: Profile | null;
  loading: boolean;

  signUp: (
    payloadOrEmail: string | SignUpPayload,
    password?: string,
    fullName?: string,
    role?: Role
  ) => Promise<{ error: string | null }>;

  signIn: (
    email: string,
    password: string,
    role?: Role
  ) => Promise<SignInResult>;

  signOut: () => Promise<void>;

  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<MongoSession | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // =====================================================
  // LOAD SAVED LOGIN
  // =====================================================
  useEffect(() => {
    const savedUser = localStorage.getItem("abasyakta_user");

    if (savedUser) {
      try {
        const rawUser = JSON.parse(savedUser);
        const normalized = normalizeProfile(rawUser);

        setSession({
          user: {
            id: normalized.id,
            email: normalized.email || "",
          },
        });

        setProfile(normalized);
      } catch (error) {
        console.error("Failed to load saved user:", error);
        localStorage.removeItem("abasyakta_user");
        localStorage.removeItem("token");
        localStorage.removeItem("authToken");
        localStorage.removeItem("abasyakta_token");
      }
    }

    setLoading(false);
  }, []);

  // =====================================================
  // CONTINUOUS LIVE GPS TRACKING FOR ONLINE WORKERS
  // =====================================================
  useEffect(() => {
    if (profile && profile.role === 'worker' && profile.is_available_now) {
      // Worker is online: start continuous background watchPosition stream
      import('@/lib/liveLocationTracker').then(({ startLiveWorkerTracking }) => {
        startLiveWorkerTracking(profile.id, profile.available_status_text || '');
      });

      return () => {
        import('@/lib/liveLocationTracker').then(({ stopLiveWorkerTracking }) => {
          stopLiveWorkerTracking();
        });
      };
    } else {
      import('@/lib/liveLocationTracker').then(({ stopLiveWorkerTracking }) => {
        stopLiveWorkerTracking();
      });
    }
  }, [profile?.id, profile?.role, profile?.is_available_now]);

  // =====================================================
  // SIGN UP
  // =====================================================
  async function signUp(
    payloadOrEmail: string | SignUpPayload,
    passwordArg?: string,
    fullNameArg?: string,
    roleArg?: Role
  ) {
    try {
      let bodyData: any;

      if (typeof payloadOrEmail === "object") {
        bodyData = {
          name: payloadOrEmail.fullName,
          full_name: payloadOrEmail.fullName,
          email: payloadOrEmail.email,
          password: payloadOrEmail.password,
          role: payloadOrEmail.role,
          phone: payloadOrEmail.phone || "",
          location: payloadOrEmail.location || "",
          company_name: payloadOrEmail.company_name || "",
          company_type: payloadOrEmail.company_type || "",
          gst_or_id: payloadOrEmail.gst_or_id || "",
          aadhaar_number: payloadOrEmail.aadhaar_number || "",
          aadhaar_verified: payloadOrEmail.aadhaar_verified ?? false,
          bank_details: payloadOrEmail.bank_details || null,
          payment_mode: payloadOrEmail.payment_mode || "bank_transfer",
          upi_id: payloadOrEmail.upi_id || "",
          terms_accepted: payloadOrEmail.terms_accepted ?? false,
          primary_skill: payloadOrEmail.primary_skill || "",
          experience_level: payloadOrEmail.experience_level || "",
          skills: payloadOrEmail.skills || (payloadOrEmail.primary_skill ? [payloadOrEmail.primary_skill] : []),
          avatar_url: payloadOrEmail.avatar_url || payloadOrEmail.profileImage || "",
          profileImage: payloadOrEmail.profileImage || payloadOrEmail.avatar_url || "",
        };
      } else {
        bodyData = {
          name: fullNameArg || "",
          full_name: fullNameArg || "",
          email: payloadOrEmail,
          password: passwordArg || "",
          role: roleArg || "worker",
          skills: [],
          location: "",
          avatar_url: "",
        };
      }

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyData),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.message || data.error || "Sign up failed",
        };
      }

      const rawUser = data.user || data;
      const normalized = normalizeProfile(rawUser);

      // Save token if available
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("abasyakta_token", data.token);
      }

      // Save user
      localStorage.setItem("abasyakta_user", JSON.stringify(normalized));

      setSession({
        user: {
          id: normalized.id,
          email: normalized.email || bodyData.email,
        },
      });

      setProfile(normalized);

      return {
        error: null,
      };
    } catch (error) {
      console.error("Sign up error:", error);
      return {
        error: "Unable to connect to backend server.",
      };
    }
  }

  // =====================================================
  // SIGN IN
  // =====================================================
  async function signIn(email: string, password: string, role?: Role): Promise<SignInResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.message || data.error || "Invalid login credentials",
          roleMismatch: Boolean(data.roleMismatch),
          targetRole: data.targetRole as Role | undefined,
          message: data.message || "",
        };
      }

      const rawUser = data.user || data;
      const normalized = normalizeProfile(rawUser);

      // Save token if available
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("abasyakta_token", data.token);
      }

      // Save user in browser
      localStorage.setItem("abasyakta_user", JSON.stringify(normalized));

      // Create frontend session
      setSession({
        user: {
          id: normalized.id,
          email: normalized.email || email,
        },
      });

      // Save profile
      setProfile(normalized);

      return {
        error: null,
        user: normalized,
      };
    } catch (error) {
      console.error("Sign in error:", error);
      return {
        error: "Unable to connect to backend server.",
      };
    }
  }

  // =====================================================
  // SIGN OUT
  // =====================================================
  async function signOut() {
    localStorage.removeItem("abasyakta_user");
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("abasyakta_token");

    setProfile(null);
    setSession(null);
  }

  // =====================================================
  // REFRESH PROFILE
  // =====================================================
  async function refreshProfile() {
    const userId = profile?.id || session?.user.id;
    if (!userId) return;

    try {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("abasyakta_token");

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        headers,
      });

      if (!response.ok) return;

      const data = await response.json();
      const normalized = normalizeProfile(data);

      setProfile(normalized);
      localStorage.setItem("abasyakta_user", JSON.stringify(normalized));
    } catch (error) {
      console.error("Refresh profile error:", error);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return ctx;
}