import { useState, useEffect } from "react";

interface UserProfile {
  name: string;
  email_id: string;
  PAN: string;
  mobile_number: string;
  _raw: any;
}

export default function Profile({
  accessToken,
  onLogout,
}: {
  accessToken: string;
  onLogout: () => void;
}) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("http://localhost:4000/api/profile", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to fetch profile");
        }

        const data = await response.json();
        setProfile(data);
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Failed to load profile";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [accessToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 w-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Loading profile...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md w-full max-w-2xl mx-auto">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-yellow-50 p-4 rounded-md w-full max-w-2xl mx-auto">
        <p className="text-yellow-700">No profile data available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6 border-b pb-3">
        <h2 className="text-2xl font-bold text-gray-800">Profile</h2>
        <button
          onClick={onLogout}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Logout
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4 w-full">
        <div className="flex flex-col">
          <span className="text-xs text-gray-500">Fyers ID</span>
          <span className="font-medium text-gray-900">{profile._raw.fy_id}</span>
        </div>

        <div className="flex flex-col">
          <span className="text-xs text-gray-500">Name</span>
          <span className="font-medium text-gray-900">{profile.name}</span>
        </div>

        <div className="flex flex-col">
          <span className="text-xs text-gray-500">Email</span>
          <span className="font-medium text-gray-900">{profile._raw.email_id}</span>
        </div>

        <div className="flex flex-col">
          <span class-name="text-xs text-gray-500">Mobile</span>
          <span class-name="font-medium text-gray-900">{profile._raw.mobile_number}</span>
        </div>

        <div className="flex flex-col">
          <span className="text-xs text-gray-500">PAN</span>
          <span className="font-medium text-gray-900">{profile._raw.PAN}</span>
        </div>
      </div>
    </div>
  );
}