// src/pages/ProductManagement/Product.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  Save,
  AlertTriangle,
  RefreshCw,
  X,
  Layers,
  Image as ImageIcon,
  ScanBarcode,
  Tag,
} from "lucide-react";

import PageHeader from "../../components/PageHeader";
import CardBox from "../../components/CardBox";
import AppModal from "../../components/AppModal";
import AlertMessage from "../../components/AlertMessage";
import TextInput from "../../components/TextInput";
import TextArea from "../../components/TextArea";
import SelectInput from "../../components/SelectInput";
import LoadingButton from "../../components/LoadingButton";
import DataTable from "../../components/DataTable";

import {
  showSuccessToast,
  showErrorToast,
  showInfoToast,
} from "../../Helper/TosterHelper";

import {
  fetchProducts,
  saveProduct,
  deleteProduct,
} from "../../services/productServices";

import { fetchCategories } from "../../services/categoryServices";
import { fetchBrands } from "../../services/brandServices";
import { fetchProductTypes } from "../../services/productTypeServices";
import { fetchAttributes } from "../../services/attributeServices";
import { useAuth } from "../../context/AuthContext";

const STATUS_OPTIONS = [
  { value: 1, label: "Active" },
  { value: 0, label: "Inactive" },
];

const emptyVariant = () => ({
  _key: Math.random().toString(36).slice(2),
  variant_name: "",
  sku: "",
  barcode: "",
  purchase_price: 0,
  selling_price: 0,
  mrp: 0,
  wholesale_price: 0,
  weight: "",
  track_stock: true,
  track_serial: false,
  status: 1,
  values: {}, // { [attribute_id]: attribute_value_id }
});

const emptyBarcode = () => ({
  _key: Math.random().toString(36).slice(2),
  barcode: "",
  barcode_type: "internal",
  is_primary: false,
  variant_index: "",
});

const emptyImage = () => ({
  _key: Math.random().toString(36).slice(2),
  file: null,
  preview: "",
  is_primary: false,
  sort_order: 0,
  variant_index: "",
});

export default function Product() {
  const { user } = useAuth();
  const myCompanyId = user?.company_id ?? null;

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [formError, setFormError] = useState("");
  const [errors, setErrors] = useState({});

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmRow, setConfirmRow] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  // ─── Modal form state ───
  const [form, setForm] = useState({
    id: 0,
    category_id: "",
    brand_id: "",
    product_type_id: "",
    name: "",
    description: "",
    base_sku: "",
    base_barcode: "",
    has_variants: false,
    track_stock: true,
    track_serial: false,
    allow_purchase: true,
    allow_sale: true,
    status: 1,
  });

  const [productImageFile, setProductImageFile] = useState(null);
  const [productImagePreview, setProductImagePreview] = useState("");

  // Nested builders
  const [attributesUsed, setAttributesUsed] = useState([]); // [{ attribute_id, is_required }]
  const [variants, setVariants] = useState([]);             // array of variant objects
  const [barcodes, setBarcodes] = useState([]);             // array of barcode objects
  const [images, setImages] = useState([]);                 // array of image objects

  // ─── LOAD ───
  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await fetchProducts();
      setProducts(res.data || []);
    } catch (err) {
      showErrorToast(err.message || "Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  const loadLookups = async () => {
    try {
      const [catRes, brandRes, typeRes, attrRes] = await Promise.allSettled([
        fetchCategories({ tree: true }),
        fetchBrands(),
        fetchProductTypes(),
        fetchAttributes({ withValues: true }),
      ]);

      const pick = (r) => (r.status === "fulfilled" ? r.value?.data || [] : []);

      setCategories(pick(catRes));
      setBrands(pick(brandRes));
      setProductTypes(pick(typeRes));
      setAttributes(pick(attrRes));
    } catch (err) {
      showErrorToast(err.message || "Failed to load lookups.");
    }
  };

  useEffect(() => {
    loadProducts();
    loadLookups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── TABLE COLUMNS ───
  const columns = [
    { key: "sl",          header: "SL",         width: 60 },
    { key: "image",       header: "Image",      width: 70 },
    { key: "name",        header: "Name" },
    { key: "category",    header: "Category" },
    { key: "brand",       header: "Brand" },
    { key: "type",        header: "Type" },
    { key: "base_sku",    header: "SKU" },
    { key: "has_variants",header: "Variants" },
    { key: "status",      header: "Status" },
    { key: "actions",     header: "Actions" },
  ];

  const imageUrlFromPath = (p) => {
    if (!p) return "";
    if (p.startsWith("http")) return p;
    const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api")
      .replace(/\/api\/?$/, "");
    return `${API_ORIGIN}/storage/${p}`;
  };

  const tableData = useMemo(() => {
    const statusBadge = (s) => {
      const active = Number(s) === 1;
      return (
        <span
          style={{
            display: "inline-block",
            minWidth: 78,
            textAlign: "center",
            padding: "4px 10px",
            borderRadius: 999,
            color: "#fff",
            fontSize: 12,
            fontWeight: 600,
            backgroundColor: active ? "#28a745" : "#dc3545",
          }}
        >
          {active ? "Active" : "Inactive"}
        </span>
      );
    };

    return products.map((p, idx) => {
      const rowSnapshot = {
        id: p.id,
        name: p.name,
        category_id: p.category_id,
        brand_id: p.brand_id,
        product_type_id: p.product_type_id,
        description: p.description,
        base_sku: p.base_sku,
        base_barcode: p.base_barcode,
        has_variants: p.has_variants,
        track_stock: p.track_stock,
        track_serial: p.track_serial,
        allow_purchase: p.allow_purchase,
        allow_sale: p.allow_sale,
        status: p.status,
        product_image: p.product_image,
      };

      return {
        ...p,
        sl: idx + 1,
        image: p.product_image ? (
          <img
            src={imageUrlFromPath(p.product_image)}
            alt=""
            className="h-8 w-8 object-contain rounded"
            onError={(e) => { e.target.style.visibility = "hidden"; }}
          />
        ) : (
          <span className="text-gray-400">—</span>
        ),
        name: p.name || "—",
        category: p.category?.name || "—",
        brand: p.brand?.name || "—",
        type: p.type?.name || "—",
        base_sku: p.base_sku ? (
          <code className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700">
            {p.base_sku}
          </code>
        ) : (
          <span className="text-gray-400">—</span>
        ),
        has_variants: p.has_variants ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
            Yes
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
            No
          </span>
        ),
        status: statusBadge(p.status),
        actions: (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => openEditModal(rowSnapshot)}
              disabled={loading}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 disabled:opacity-50"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
            <button
              type="button"
              onClick={() => askDelete(rowSnapshot)}
              disabled={loading}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        ),
      };
    });
  }, [products, loading]);

  // ─── FORM HELPERS ───
  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
    if (formError) setFormError("");
  };

  const resetModal = () => {
    setForm({
      id: 0,
      category_id: "",
      brand_id: "",
      product_type_id: "",
      name: "",
      description: "",
      base_sku: "",
      base_barcode: "",
      has_variants: false,
      track_stock: true,
      track_serial: false,
      allow_purchase: true,
      allow_sale: true,
      status: 1,
    });
    setProductImageFile(null);
    setProductImagePreview("");
    setAttributesUsed([]);
    setVariants([]);
    setBarcodes([]);
    setImages([]);
    setErrors({});
    setFormError("");
  };

  const validateForm = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required";
    else if (form.name.trim().length > 200)
      errs.name = "Name must be 200 characters or less";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ─── OPEN MODALS ───
  const openCreateModal = () => {
    if (!myCompanyId) {
      showErrorToast("Your account is not linked to a company.");
      return;
    }
    setModalMode("create");
    setEditRow(null);
    resetModal();
    setModalOpen(true);
  };

  const openEditModal = (row) => {
    setModalMode("edit");
    setEditRow(row);
    resetModal();
    setForm({
      id: row.id,
      category_id: row.category_id ?? "",
      brand_id: row.brand_id ?? "",
      product_type_id: row.product_type_id ?? "",
      name: row.name || "",
      description: row.description || "",
      base_sku: row.base_sku || "",
      base_barcode: row.base_barcode || "",
      has_variants: !!row.has_variants,
      track_stock: !!row.track_stock,
      track_serial: !!row.track_serial,
      allow_purchase: !!row.allow_purchase,
      allow_sale: !!row.allow_sale,
      status: Number(row.status) === 1 ? 1 : 0,
    });
    if (row.product_image) {
      setProductImagePreview(imageUrlFromPath(row.product_image));
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalMode(null);
    setEditRow(null);
    resetModal();
  };

  // ─── PRODUCT IMAGE ───
  const handleProductImage = (e) => {
    const file = e.target.files?.[0] || null;
    setProductImageFile(file);
    setProductImagePreview(file ? URL.createObjectURL(file) : "");
  };

  // ─── ATTRIBUTES ───
  const addAttribute = (attributeId) => {
    if (!attributeId) return;
    const id = Number(attributeId);
    if (attributesUsed.some((a) => Number(a.attribute_id) === id)) return;
    setAttributesUsed((prev) => [...prev, { attribute_id: id, is_required: true }]);
  };

  const removeAttribute = (attributeId) => {
    setAttributesUsed((prev) =>
      prev.filter((a) => Number(a.attribute_id) !== Number(attributeId))
    );
    // Remove this attribute from all variants' values
    setVariants((prev) =>
      prev.map((v) => {
        const next = { ...v, values: { ...v.values } };
        delete next.values[attributeId];
        return next;
      })
    );
  };

  // ─── VARIANTS ───
  const addVariant = () => setVariants((prev) => [...prev, emptyVariant()]);
  const removeVariant = (key) =>
    setVariants((prev) => prev.filter((v) => v._key !== key));
  const updateVariant = (key, field, value) =>
    setVariants((prev) =>
      prev.map((v) => (v._key === key ? { ...v, [field]: value } : v))
    );
  const setVariantValue = (key, attributeId, valueId) =>
    setVariants((prev) =>
      prev.map((v) =>
        v._key === key
          ? { ...v, values: { ...v.values, [attributeId]: valueId } }
          : v
      )
    );

  // ─── BARCODES ───
  const addBarcode = () => setBarcodes((prev) => [...prev, emptyBarcode()]);
  const removeBarcode = (key) =>
    setBarcodes((prev) => prev.filter((b) => b._key !== key));
  const updateBarcode = (key, field, value) =>
    setBarcodes((prev) =>
      prev.map((b) => (b._key === key ? { ...b, [field]: value } : b))
    );

  // ─── IMAGES ───
  const addImage = () => setImages((prev) => [...prev, emptyImage()]);
  const removeImage = (key) =>
    setImages((prev) => prev.filter((i) => i._key !== key));
  const updateImage = (key, field, value) =>
    setImages((prev) =>
      prev.map((img) => (img._key === key ? { ...img, [field]: value } : img))
    );
  const handleImageFile = (key, file) =>
    setImages((prev) =>
      prev.map((img) =>
        img._key === key
          ? {
              ...img,
              file,
              preview: file ? URL.createObjectURL(file) : "",
            }
          : img
      )
    );

  // ─── SAVE ───
  const handleSave = async () => {
    if (!validateForm()) {
      showErrorToast("Please fix the highlighted fields");
      return;
    }
    if (!myCompanyId) {
      const msg = "Your account is not linked to a company.";
      setFormError(msg);
      showErrorToast(msg);
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      // Build variants array with values mapped to objects
      const variantsPayload = variants.map((v) => ({
        variant_name: v.variant_name,
        sku: v.sku || null,
        barcode: v.barcode || null,
        purchase_price: Number(v.purchase_price || 0),
        selling_price: Number(v.selling_price || 0),
        mrp: Number(v.mrp || 0),
        wholesale_price: Number(v.wholesale_price || 0),
        weight: v.weight === "" ? null : Number(v.weight),
        track_stock: v.track_stock,
        track_serial: v.track_serial,
        status: Number(v.status),
        values: Object.entries(v.values || {})
          .filter(([_, valueId]) => valueId)
          .map(([attrId, valueId]) => ({
            attribute_id: Number(attrId),
            attribute_value_id: Number(valueId),
          })),
      }));

      const payload = {
        company_id: Number(myCompanyId),
        category_id: form.category_id === "" ? null : Number(form.category_id),
        brand_id: form.brand_id === "" ? null : Number(form.brand_id),
        product_type_id:
          form.product_type_id === "" ? null : Number(form.product_type_id),

        name: form.name.trim(),
        description: form.description.trim() || null,
        base_sku: form.base_sku.trim() || null,
        base_barcode: form.base_barcode.trim() || null,

        has_variants: form.has_variants || variants.length > 0 ? 1 : 0,
        track_stock: form.track_stock ? 1 : 0,
        track_serial: form.track_serial ? 1 : 0,
        allow_purchase: form.allow_purchase ? 1 : 0,
        allow_sale: form.allow_sale ? 1 : 0,
        status: Number(form.status),

        attributes: attributesUsed.map((a) => ({
          attribute_id: a.attribute_id,
          is_required: a.is_required ? 1 : 0,
        })),

        variants: variantsPayload,

        barcodes: barcodes
          .filter((b) => b.barcode.trim())
          .map((b) => ({
            barcode: b.barcode.trim(),
            barcode_type: b.barcode_type,
            is_primary: b.is_primary ? 1 : 0,
            variant_index:
              b.variant_index === "" ? null : Number(b.variant_index),
          })),

        images: images
          .filter((i) => i.file)
          .map((i) => ({
            file: i.file,
            is_primary: i.is_primary ? 1 : 0,
            sort_order: Number(i.sort_order || 0),
            variant_index:
              i.variant_index === "" ? null : Number(i.variant_index),
          })),
      };

      if (productImageFile) payload.product_image = productImageFile;

      await saveProduct(payload);
      showSuccessToast("Product created successfully");

      closeModal();
      await loadProducts();
    } catch (err) {
      const msg = err.message || "Failed to save product";
      setFormError(msg);
      showErrorToast(msg);
    } finally {
      setSaving(false);
    }
  };

  // ─── DELETE ───
  const askDelete = (row) => {
    setConfirmRow(row);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!confirmRow?.id) return;
    setConfirmBusy(true);
    try {
      await deleteProduct(confirmRow.id);
      showSuccessToast(`"${confirmRow.name}" deleted`);
      setConfirmOpen(false);
      setConfirmRow(null);
      await loadProducts();
    } catch (err) {
      showErrorToast(err.message || "Failed to delete");
    } finally {
      setConfirmBusy(false);
    }
  };

  // ─── SELECT OPTIONS ───
  const categoryOptions = useMemo(() => {
    const out = [{ value: "", label: "— Select a category —" }];
    const walk = (nodes, level = 0) => {
      (nodes || []).forEach((n) => {
        out.push({
          value: String(n.id),
          label: `${"— ".repeat(level)}${n.name}`,
        });
        walk(n.children, level + 1);
      });
    };
    walk(categories);
    return out;
  }, [categories]);

  const brandOptions = useMemo(
    () => [
      { value: "", label: "— Select a brand —" },
      ...brands.map((b) => ({ value: String(b.id), label: b.name })),
    ],
    [brands]
  );

  const productTypeOptions = useMemo(
    () => [
      { value: "", label: "— Select a type —" },
      ...productTypes.map((t) => ({ value: String(t.id), label: t.name })),
    ],
    [productTypes]
  );

  // Attributes not yet applied — available to add
  const availableAttributes = useMemo(() => {
    const usedIds = new Set(attributesUsed.map((a) => Number(a.attribute_id)));
    return attributes.filter((a) => !usedIds.has(Number(a.id)));
  }, [attributes, attributesUsed]);

  // The full attribute object (with values) for each used attribute
  const usedAttributesFull = useMemo(() => {
    return attributesUsed
      .map((a) => attributes.find((x) => Number(x.id) === Number(a.attribute_id)))
      .filter(Boolean);
  }, [attributesUsed, attributes]);

  // ─── RENDER ───
  return (
    <div>
      <PageHeader
        title="Products"
        icon={Package}
        breadcrumb
        onClickGuide={() => showInfoToast("Opening guide...")}
      />

      <CardBox
        title="My Products"
        subTitle={`${products.length} item(s)`}
        icon={Package}
        headerBgColor="light"
        buttons={[
          {
            text: "Add Product",
            icon: Plus,
            color: "primary",
            onClick: openCreateModal,
          },
          {
            text: "Refresh",
            icon: RefreshCw,
            color: "secondary",
            onClick: () => {
              showInfoToast("Refreshing...");
              loadProducts();
            },
          },
        ]}
      >
        <DataTable
          data={tableData}
          columns={columns}
          loading={loading}
          searchable
          searchPlaceholder="Search products..."
          sortable
          paginated
          initialPageSize={10}
          pageSizeOptions={[10, 25, 50]}
          striped
          stickyHeader
          emptyMessage="No products yet"
          emptyHint="Click 'Add Product' to create your first one."
        />
      </CardBox>

      {/* ═══════════ Product Modal ═══════════ */}
      <AppModal
        show={modalOpen}
        onHide={closeModal}
        title={modalMode === "edit" ? "Edit Product" : "Add Product"}
        subtitle={modalMode === "edit" ? editRow?.name || "" : "Create a new product"}
        icon={modalMode === "edit" ? Pencil : Plus}
        size="xl"
        footer={
          <LoadingButton
            isLoading={saving}
            text={modalMode === "edit" ? "Save Changes" : "Create Product"}
            icon={Save}
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold uppercase transition-colors disabled:opacity-60"
          />
        }
      >
        <div className="space-y-6">
          {formError && <AlertMessage type="danger" message={formError} />}

          {/* ── Section: Basic Info ── */}
          <section>
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">
              Basic Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextInput
                label="Name"
                name="name"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="e.g. Samsung Galaxy A56"
                required
                error={errors.name}
              />
              <TextInput
                label="Base SKU"
                name="base_sku"
                value={form.base_sku}
                onChange={(e) => setField("base_sku", e.target.value)}
                placeholder="e.g. SGA56"
              />
              <TextInput
                label="Base Barcode"
                name="base_barcode"
                value={form.base_barcode}
                onChange={(e) => setField("base_barcode", e.target.value)}
                placeholder="e.g. 1234567890123"
              />
              <SelectInput
                label="Status"
                name="status"
                value={form.status}
                onChange={(e) => setField("status", e.target.value)}
                options={STATUS_OPTIONS}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <SelectInput
                label="Category"
                name="category_id"
                value={form.category_id}
                onChange={(e) => setField("category_id", e.target.value)}
                options={categoryOptions}
              />
              <SelectInput
                label="Brand"
                name="brand_id"
                value={form.brand_id}
                onChange={(e) => setField("brand_id", e.target.value)}
                options={brandOptions}
              />
              <SelectInput
                label="Product Type"
                name="product_type_id"
                value={form.product_type_id}
                onChange={(e) => setField("product_type_id", e.target.value)}
                options={productTypeOptions}
              />
            </div>

            <div className="mt-4">
              <TextArea
                label="Description"
                name="description"
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                placeholder="Short description..."
                rows={3}
              />
            </div>

            {/* Product image + flags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block mb-1 text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">
                  Product Image
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleProductImage}
                    className="block text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:font-medium file:cursor-pointer hover:file:bg-blue-700"
                  />
                  {productImagePreview && (
                    <img
                      src={productImagePreview}
                      alt="preview"
                      className="h-12 w-12 rounded border object-contain bg-white"
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-5">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.track_stock}
                    onChange={(e) => setField("track_stock", e.target.checked)}
                  />
                  Track stock
                </label>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.track_serial}
                    onChange={(e) => setField("track_serial", e.target.checked)}
                  />
                  Track serial
                </label>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.allow_purchase}
                    onChange={(e) => setField("allow_purchase", e.target.checked)}
                  />
                  Allow purchase
                </label>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.allow_sale}
                    onChange={(e) => setField("allow_sale", e.target.checked)}
                  />
                  Allow sale
                </label>
              </div>
            </div>
          </section>

          {/* ── Section: Attributes ── */}
          <section className="border-t pt-5 dark:border-gray-700">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Attributes Used
            </h3>

            <div className="flex flex-wrap items-center gap-3 mb-3">
              <div className="flex-1 min-w-[220px]">
                <SelectInput
                  label=""
                  name="add_attribute"
                  value=""
                  onChange={(e) => {
                    addAttribute(e.target.value);
                    e.target.value = "";
                  }}
                  options={[
                    { value: "", label: "+ Add an attribute" },
                    ...availableAttributes.map((a) => ({
                      value: String(a.id),
                      label: a.display_name,
                    })),
                  ]}
                />
              </div>
            </div>

            {usedAttributesFull.length === 0 ? (
              <p className="text-xs text-gray-500">
                No attributes yet. Add Color, Size, RAM, etc.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {usedAttributesFull.map((a) => (
                  <span
                    key={a.id}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    {a.display_name}
                    <button
                      type="button"
                      onClick={() => removeAttribute(a.id)}
                      className="text-blue-700 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* ── Section: Variants ── */}
          <section className="border-t pt-5 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Variants
              </h3>
              <button
                type="button"
                onClick={addVariant}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-blue-600 text-white hover:bg-blue-700"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Variant
              </button>
            </div>

            {variants.length === 0 ? (
              <p className="text-xs text-gray-500">
                No variants. Add variants only if this product has multiple
                options (Color, Size, etc.).
              </p>
            ) : (
              <div className="space-y-3">
                {variants.map((v, idx) => (
                  <div
                    key={v._key}
                    className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800/40"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                        Variant #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeVariant(v._key)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <TextInput
                        label="Variant Name"
                        value={v.variant_name}
                        onChange={(e) =>
                          updateVariant(v._key, "variant_name", e.target.value)
                        }
                        placeholder="e.g. Black / XL"
                      />
                      <TextInput
                        label="SKU"
                        value={v.sku}
                        onChange={(e) =>
                          updateVariant(v._key, "sku", e.target.value)
                        }
                      />
                      <TextInput
                        label="Barcode"
                        value={v.barcode}
                        onChange={(e) =>
                          updateVariant(v._key, "barcode", e.target.value)
                        }
                      />
                      <TextInput
                        label="Purchase Price"
                        type="number"
                        value={v.purchase_price}
                        onChange={(e) =>
                          updateVariant(v._key, "purchase_price", e.target.value)
                        }
                      />
                      <TextInput
                        label="Selling Price"
                        type="number"
                        value={v.selling_price}
                        onChange={(e) =>
                          updateVariant(v._key, "selling_price", e.target.value)
                        }
                      />
                      <TextInput
                        label="MRP"
                        type="number"
                        value={v.mrp}
                        onChange={(e) =>
                          updateVariant(v._key, "mrp", e.target.value)
                        }
                      />
                      <TextInput
                        label="Wholesale Price"
                        type="number"
                        value={v.wholesale_price}
                        onChange={(e) =>
                          updateVariant(v._key, "wholesale_price", e.target.value)
                        }
                      />
                      <TextInput
                        label="Weight"
                        type="number"
                        value={v.weight}
                        onChange={(e) =>
                          updateVariant(v._key, "weight", e.target.value)
                        }
                      />
                      <SelectInput
                        label="Status"
                        value={v.status}
                        onChange={(e) =>
                          updateVariant(v._key, "status", e.target.value)
                        }
                        options={STATUS_OPTIONS}
                      />
                    </div>

                    {/* Variant values — one dropdown per used attribute */}
                    {usedAttributesFull.length > 0 && (
                      <div className="mt-3">
                        <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">
                          Attribute Values
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {usedAttributesFull.map((a) => {
                            const valueOptions = (a.values || []).map((val) => ({
                              value: String(val.id),
                              label: val.display_name,
                            }));
                            return (
                              <SelectInput
                                key={a.id}
                                label={a.display_name}
                                value={v.values?.[a.id] || ""}
                                onChange={(e) =>
                                  setVariantValue(v._key, a.id, e.target.value)
                                }
                                options={[
                                  { value: "", label: "— Select —" },
                                  ...valueOptions,
                                ]}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Section: Barcodes ── */}
          <section className="border-t pt-5 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                <ScanBarcode className="w-4 h-4" />
                Extra Barcodes
              </h3>
              <button
                type="button"
                onClick={addBarcode}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-blue-600 text-white hover:bg-blue-700"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Barcode
              </button>
            </div>

            {barcodes.length === 0 ? (
              <p className="text-xs text-gray-500">
                No additional barcodes. Add EAN, UPC, or supplier codes.
              </p>
            ) : (
              <div className="space-y-2">
                {barcodes.map((b) => (
                  <div
                    key={b._key}
                    className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40"
                  >
                    <TextInput
                      label="Barcode"
                      value={b.barcode}
                      onChange={(e) =>
                        updateBarcode(b._key, "barcode", e.target.value)
                      }
                    />
                    <SelectInput
                      label="Type"
                      value={b.barcode_type}
                      onChange={(e) =>
                        updateBarcode(b._key, "barcode_type", e.target.value)
                      }
                      options={[
                        { value: "internal", label: "Internal" },
                        { value: "ean",      label: "EAN" },
                        { value: "upc",      label: "UPC" },
                        { value: "supplier", label: "Supplier" },
                        { value: "other",    label: "Other" },
                      ]}
                    />
                    <SelectInput
                      label="Variant"
                      value={b.variant_index}
                      onChange={(e) =>
                        updateBarcode(b._key, "variant_index", e.target.value)
                      }
                      options={[
                        { value: "", label: "— Product —" },
                        ...variants.map((v, i) => ({
                          value: String(i),
                          label: v.variant_name || `Variant #${i + 1}`,
                        })),
                      ]}
                    />
                    <label className="inline-flex items-center gap-2 text-sm pb-2">
                      <input
                        type="checkbox"
                        checked={b.is_primary}
                        onChange={(e) =>
                          updateBarcode(b._key, "is_primary", e.target.checked)
                        }
                      />
                      Primary
                    </label>
                    <div className="flex justify-end pb-2">
                      <button
                        type="button"
                        onClick={() => removeBarcode(b._key)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Section: Extra Images ── */}
          <section className="border-t pt-5 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Extra Images
              </h3>
              <button
                type="button"
                onClick={addImage}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-blue-600 text-white hover:bg-blue-700"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Image
              </button>
            </div>

            {images.length === 0 ? (
              <p className="text-xs text-gray-500">
                No extra images.
              </p>
            ) : (
              <div className="space-y-2">
                {images.map((img) => (
                  <div
                    key={img._key}
                    className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40"
                  >
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold uppercase text-gray-600 dark:text-gray-300 mb-1">
                        File
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={(e) =>
                            handleImageFile(img._key, e.target.files?.[0] || null)
                          }
                          className="block text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:font-medium file:cursor-pointer hover:file:bg-blue-700"
                        />
                        {img.preview && (
                          <img
                            src={img.preview}
                            alt=""
                            className="h-10 w-10 rounded border object-contain bg-white"
                            onError={(e) => { e.target.style.display = "none"; }}
                          />
                        )}
                      </div>
                    </div>

                    <SelectInput
                      label="Variant"
                      value={img.variant_index}
                      onChange={(e) =>
                        updateImage(img._key, "variant_index", e.target.value)
                      }
                      options={[
                        { value: "", label: "— Product —" },
                        ...variants.map((v, i) => ({
                          value: String(i),
                          label: v.variant_name || `Variant #${i + 1}`,
                        })),
                      ]}
                    />

                    <TextInput
                      label="Sort Order"
                      type="number"
                      value={img.sort_order}
                      onChange={(e) =>
                        updateImage(img._key, "sort_order", e.target.value)
                      }
                    />

                    <div className="flex items-center gap-3 pb-2">
                      <label className="inline-flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={img.is_primary}
                          onChange={(e) =>
                            updateImage(img._key, "is_primary", e.target.checked)
                          }
                        />
                        Primary
                      </label>
                      <button
                        type="button"
                        onClick={() => removeImage(img._key)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </AppModal>

      {/* ═══════════ Delete Modal ═══════════ */}
      <AppModal
        show={confirmOpen}
        onHide={() => setConfirmOpen(false)}
        title="Confirm Delete"
        subtitle={confirmRow ? `Delete "${confirmRow.name}"?` : ""}
        icon={AlertTriangle}
        size="sm"
        footer={
          <LoadingButton
            isLoading={confirmBusy}
            text="Delete"
            icon={Trash2}
            onClick={confirmDelete}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-bold uppercase transition-colors disabled:opacity-60"
          />
        }
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">
          This action cannot be undone. All variants, images and barcodes under
          this product will also be removed.
        </p>
      </AppModal>
    </div>
  );
}