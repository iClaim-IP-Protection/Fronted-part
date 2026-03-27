import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { assetsAPI, authAPI } from "../services/api";

export default function EditAsset() {
  const { assetId } = useParams();
  const navigate = useNavigate();

  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    version: "",
    previous_asset_id: "",
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchAssetDetails();
  }, [assetId]);

  const fetchAssetDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check auth
      const token = authAPI.getToken();
      if (!token) {
        navigate("/login");
        return;
      }

      // Fetch asset details from backend
      const data = await assetsAPI.getAssets(assetId);
      setAsset(data);

      // Set initial form data
      setFormData({
        title: data.asset_title || "",
        version: data.version || "",
        previous_asset_id: data.previous_asset_id || "",
      });
    } catch (err) {
      console.error("Error fetching asset details:", err);
      if (err.message?.includes("401")) {
        navigate("/login");
      } else {
        setError(err.message || "Failed to load asset details");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field if it exists
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (formData.title && formData.title.trim() === "") {
      errors.title = "Title cannot be empty";
    }

    if (formData.version !== "" && isNaN(Number(formData.version))) {
      errors.version = "Version must be a valid number";
    }

    if (formData.version !== "" && Number(formData.version) < 0) {
      errors.version = "Version must be a positive number";
    }

    if (
      formData.previous_asset_id !== "" &&
      isNaN(Number(formData.previous_asset_id))
    ) {
      errors.previous_asset_id = "Previous Asset ID must be a valid number";
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Prepare update data - only include fields that have values
      const updateData = {};
      if (formData.title) {
        updateData.title = formData.title;
      }
      if (formData.version !== "") {
        updateData.version = Number(formData.version);
      }
      if (formData.previous_asset_id !== "") {
        updateData.previous_asset_id = Number(formData.previous_asset_id);
      }

      // If no fields to update, show message
      if (Object.keys(updateData).length === 0) {
        setError("Please update at least one field");
        return;
      }

      // Call API to update asset
      const response = await assetsAPI.updateAsset(assetId, updateData);

      // Show success message and redirect
      navigate(`/assets/${assetId}`);
    } catch (err) {
      console.error("Error updating asset:", err);
      setError(err.message || "Failed to update asset");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-gray-600">Loading asset details...</div>
      </div>
    );
  }

  if (error && !asset) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate(`/assets/${assetId}`)}
            className="mb-4 text-blue-600 hover:text-blue-800"
          >
            ← Back to Asset
          </button>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-600 mb-2">Error</h2>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate("/my-assets")}
            className="mb-4 text-blue-600 hover:text-blue-800"
          >
            ← Back to My Assets
          </button>
          <div className="bg-gray-100 rounded-lg p-6 text-center text-gray-600">
            Asset not found
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(`/assets/${assetId}`)}
          className="mb-6 text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
        >
          ← Back to Asset
        </button>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">Edit Asset</h1>
            <p className="text-blue-100">Asset: {asset.asset_title}</p>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {/* Title Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Asset Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Leave empty to keep current title"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                  formErrors.title ? "border-red-500" : "border-gray-300"
                }`}
              />
              {formErrors.title && (
                <p className="text-red-600 text-sm mt-1">{formErrors.title}</p>
              )}
              <p className="text-gray-500 text-sm mt-1">
                Current: {asset.asset_title}
              </p>
            </div>

            {/* Version Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Version Number
              </label>
              <input
                type="number"
                name="version"
                value={formData.version}
                onChange={handleInputChange}
                placeholder="Leave empty to keep current version"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                  formErrors.version ? "border-red-500" : "border-gray-300"
                }`}
              />
              {formErrors.version && (
                <p className="text-red-600 text-sm mt-1">{formErrors.version}</p>
              )}
              <p className="text-gray-500 text-sm mt-1">
                Current: {asset.version}
              </p>
            </div>

            {/* Previous Asset ID Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Previous Asset ID
              </label>
              <input
                type="number"
                name="previous_asset_id"
                value={formData.previous_asset_id}
                onChange={handleInputChange}
                placeholder="Leave empty to keep current or remove"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                  formErrors.previous_asset_id
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              />
              {formErrors.previous_asset_id && (
                <p className="text-red-600 text-sm mt-1">
                  {formErrors.previous_asset_id}
                </p>
              )}
              <p className="text-gray-500 text-sm mt-1">
                Current: {asset.previous_asset_id || "—"}
              </p>
            </div>

            {/* Form Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm">
                <strong>Note:</strong> Leave fields empty to keep their current
                values. You must update at least one field.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Updating..." : "Update Asset"}
              </button>
              <button
                type="button"
                onClick={() => navigate(`/assets/${assetId}`)}
                disabled={submitting}
                className="flex-1 bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition font-medium disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
