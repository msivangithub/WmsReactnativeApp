import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  BackHandler,
  ToastAndroid,
  ScrollView,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useApi } from "./APIcontext";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import BarcodeScanner from './Barcodescan';

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// Responsive helper functions
const wp = (percentage) => {
  const value = (percentage * screenWidth) / 100;
  return Math.round(value);
};

const hp = (percentage) => {
  const value = (percentage * screenHeight) / 100;
  return Math.round(value);
};

const isTablet = screenWidth >= 768;
const isSmallScreen = screenWidth < 360;

const FranchiseTransfer = ({ onBack }) => {
  const { API_URL } = useApi();
  const [transNo, setTransNo] = useState("");
  const [transNoOptions, setTransNoOptions] = useState([]);
  const [transNoSearch, setTransNoSearch] = useState("");
  const [filteredTransNoOptions, setFilteredTransNoOptions] = useState([]);
  const [isTransNoModalOpen, setIsTransNoModalOpen] = useState(false);
  const [showTransNo, setShowTransNo] = useState(false);
  const [source, setSource] = useState("");
  const [sourceStateCode, setSourceStateCode] = useState("");
  const [sourceOptions, setSourceOptions] = useState([]);
  const [sourceSearch, setSourceSearch] = useState("");
  const [filteredSourceOptions, setFilteredSourceOptions] = useState([]);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [destination, setDestination] = useState("");
  const [destinationOptions, setDestinationOptions] = useState([]);
  const [destinationSearch, setDestinationSearch] = useState("");
  const [filteredDestinationOptions, setFilteredDestinationOptions] = useState([]);
  const [isDestinationModalOpen, setIsDestinationModalOpen] = useState(false);
  const [itemDemCode, setItemDemCode] = useState("");
  const [itemCodeOptions, setItemCodeOptions] = useState([]);
  const [mrp, setMrp] = useState("");
  const [currentQty, setCurrentQty] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [outTaxType, setOutTaxType] = useState("Inclusive");
  const [markupOn, setMarkupOn] = useState("");
  const [markupOptions, setMarkupOptions] = useState([
    { label: "Select Markup", value: "" },
  ]);
  const [atPercent, setAtPercent] = useState("");
  const [remarks, setRemarks] = useState("");
  const [allItems, setAllItems] = useState([]);
  const [totalItems, setTotalItems] = useState("0");
  const [totalExpQty, setTotalExpQty] = useState("0");
  const [mrpValue, setMrpValue] = useState("0.00");
  const [tcsPercent, setTcsPercent] = useState("0");
  const [grossAmount, setGrossAmount] = useState("0.00");
  const [taxAmt, setTaxAmt] = useState("0.00");
  const [roundOff, setRoundOff] = useState("0.00");
  const [netAmount, setNetAmount] = useState("0.00");
  const [rowHeights, setRowHeights] = useState({});
  const [loading, setLoading] = useState(false);
  const [transNoToBranchMap, setTransNoToBranchMap] = useState({});
  const [branchType, setBranchType] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [isOutTaxModalOpen, setIsOutTaxModalOpen] = useState(false);
  const [isMarkupModalOpen, setIsMarkupModalOpen] = useState(false);
  const [selectedItemCategoryType, setSelectedItemCategoryType] = useState("");
  const [lastAddedItemId, setLastAddedItemId] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isEditQtyModalOpen, setIsEditQtyModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editQty, setEditQty] = useState("");

  const fixedColumnScrollRef = useRef(null);
  const scrollableColumnsRef = useRef(null);
  const isScrolling = useRef(false);
  const itemCodeInputRef = useRef(null);
  const qtyInputRef = useRef(null);
  const tapCount = useRef(0);
  const lastTap = useRef(0);
  const transNoInputRef = useRef(null);

  const showToast = (message) => {
    ToastAndroid.show(message, ToastAndroid.LONG);
  };

  // Save unsaved transfer
  useEffect(() => {
    const saveUnsavedTransfer = async () => {
      if (allItems.length > 0) {
        const transferData = {
          transNo,
          source,
          destination,
          remarks,
          outTaxType,
          markupOn,
          atPercent,
          allItems,
          totalItems,
          totalExpQty,
          mrpValue,
          tcsPercent,
          grossAmount,
          taxAmt,
          roundOff,
          netAmount,
        };
        try {
          await AsyncStorage.setItem('unsavedTransfer', JSON.stringify(transferData));
        } catch (e) {
          console.error('Failed to store unsaved transfer:', e.message);
        }
      }
    };
    saveUnsavedTransfer();
  }, [allItems]);

  const clearUnsavedTransfer = async () => {
    try {
      await AsyncStorage.removeItem('unsavedTransfer');
    } catch (e) {
      console.error('Failed to remove unsaved transfer:', e.message);
    }
  };

  const restoreUnsavedTransfer = async () => {
    try {
      const saved = await AsyncStorage.getItem('unsavedTransfer');
      if (saved) {
        const data = JSON.parse(saved);
        setTransNo(data.transNo || "");
        setSource(data.source || "");
        setDestination(data.destination || "");
        setRemarks(data.remarks || "");
        setOutTaxType(data.outTaxType || "Inclusive");
        setMarkupOn(data.markupOn || "");
        setAtPercent(data.atPercent || "");
        setAllItems(data.allItems || []);
        showToast("Restored unsaved transfer!");
        itemCodeInputRef.current?.focus();
      }
    } catch (e) {
      console.error('Failed to restore unsaved transfer:', e.message);
    }
  };

  // Fetch Trans No Details with ToBranch
  const fetchTransNoDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/api/StockExportToFranchise/api/V1/GetTransNoDetails`
      );
      const text = await response.text();

      if (!response.ok) {
        console.error(`HTTP Error: ${response.status} - ${text}`);
        showToast(`Failed to fetch Trans No details: HTTP ${response.status}`);
        return;
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error(`Non-JSON response: ${text}`);
        showToast("Failed to fetch Trans No details: Invalid response format");
        return;
      }

      const data = JSON.parse(text);

      if (
        Array.isArray(data) &&
        data.length > 0 &&
        Array.isArray(data[0]) &&
        data[0].length > 0
      ) {
        const transNos = data[0][0].map((item) => ({
          tranNo: item.TranNo,
          refNo: item.RefNo,
          id: item.Id || "",
          toBranch: item.ToBranch || "",
          transDate: item.TransDate || null,
        }));

        const search = transNoSearch.toLowerCase();
        const filtered = transNos.filter(option =>
          option.tranNo?.toLowerCase().includes(search) ||
          option.refNo?.toLowerCase().includes(search)
        );

        setTransNoOptions(transNos);
        setFilteredTransNoOptions(filtered);

        const transNoMap = transNos.reduce((map, item) => {
          map[item.tranNo] = {
            id: item.id,
            refNo: item.refNo,
            toBranch: item.toBranch
          };
          return map;
        }, {});
        setTransNoToBranchMap(transNoMap);
      } else {
        showToast("Unexpected Trans No response structure");
      }
    } catch (error) {
      console.error("Error fetching Trans No:", error.message);
      showToast(`Failed to fetch Trans No details: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Markup Details
  const fetchMarkupDetails = async (branchId) => {
    if (!branchId) return;
    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/api/StockExportToFranchise/api/V1/GetMarkupListDetails?BranchId=${branchId}`
      );
      const text = await response.text();
      if (!response.ok) {
        console.error(`HTTP Error: ${response.status} - ${text}`);
        showToast(`Failed to fetch Markup details: HTTP ${response.status}`);
        return;
      }
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error(`Non-JSON response: ${text}`);
        showToast("Failed to fetch Markup details: Invalid response format");
        return;
      }
      const data = JSON.parse(text);
      if (
        Array.isArray(data) &&
        data.length > 0 &&
        Array.isArray(data[0]) &&
        data[0].length > 0 &&
        Array.isArray(data[0][0])
      ) {
        const markupData = data[0][0].map((item) => ({
          label: item.MarkName,
          value: item.MarkName,
          markPer: item.MarkPer.toString(),
        }));
        setMarkupOptions([
          { label: "Select Markup", value: "" },
          ...markupData,
        ]);
        if (markupData.length > 0) {
          setMarkupOn(markupData[0].value);
          setAtPercent(markupData[0].markPer);
        }
      } else {
        setMarkupOptions([{ label: "Select Markup", value: "" }]);
        setMarkupOn("");
        setAtPercent("");
      }
    } catch (error) {
      console.error("Error fetching Markup:", error.message);
      showToast(`Failed to fetch Markup details: ${error.message}`);
      setMarkupOptions([{ label: "Select Markup", value: "" }]);
      setMarkupOn("");
      setAtPercent("");
    } finally {
      setLoading(false);
    }
  };

  const fetchTransNoItems = async (transNo, destBranch) => {
    if (!destBranch) {
      destBranch = transNoToBranchMap[transNo]?.toBranch || "";
      if (!destBranch) {
        showToast("Please select a Destination or ensure Trans No has a valid ToBranch");
        setTransNo("");
        setAllItems([]);
        return;
      }
    }
    if (!transNo) {
      setAllItems([]);
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/api/StockExportToFranchise/api/V1/GetByIdTransNoDetails?TransNo=${transNo}&DestBranch=${destBranch}`
      );
      const text = await response.text();

      if (!response.ok) {
        console.error(`HTTP Error: ${response.status} - ${text}`);
        showToast(`Failed to fetch Trans No items: HTTP ${response.status}`);
        setAllItems([]);
        return;
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error(`Non-JSON response: ${text}`);
        showToast("Failed to fetch Trans No items: Invalid response format");
        setAllItems([]);
        return;
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError.message);
        showToast("Failed to fetch Trans No items: Invalid JSON response");
        setAllItems([]);
        return;
      }

      // Validate response structure
      if (
        !Array.isArray(data) ||
        data.length === 0 ||
        !Array.isArray(data[0]) ||
        data[0].length === 0 ||
        !Array.isArray(data[0][0])
      ) {
        console.error("Unexpected Trans No items response structure:", data);
        showToast("Unexpected Trans No items response structure");
        setAllItems([]);
        return;
      }

      let hasError = false;
      const items = await Promise.all(
        data[0][0].map(async (item) => {
          try {
            let newPurRate = 0.0;
            const markName = markupOn;
            const markPer = parseFloat(atPercent) || 0;
            const purchasePrice = parseFloat(item.PurchasePrice) || 0;
            const mrpValue = parseFloat(item.MRP) || 0;
            const discountPrice = parseFloat(item.DiscountPrice) || 0;
            const wsp = parseFloat(item.WSP) || purchasePrice;
            let isMarkUp = false;

            if (item.Taxtype) {
              setOutTaxType(item.Taxtype === "I" ? "Inclusive" : "Exclusive");
            }

            if (markName === "Purchase Price" || markName === "WSP Price") {
              isMarkUp = true;
            } else if (
              markName === "Special MRP" ||
              markName === "Spl MRP with Slab" ||
              markName === "MRP"
            ) {
              isMarkUp = false;
            } else {
              newPurRate = purchasePrice;
            }

            if (isMarkUp) {
              if (markName === "WSP Price") {
                newPurRate = wsp;
              } else {
                newPurRate = purchasePrice;
              }
              newPurRate = newPurRate + (newPurRate * markPer) / 100;
            } else {
              let per = markPer;
              if (markName === "Special MRP") {
                newPurRate = discountPrice;
              } else if (markName === "Spl MRP with Slab") {
                newPurRate = discountPrice;
              } else {
                newPurRate = mrpValue;
              }
              newPurRate = newPurRate - (newPurRate * per) / 100;
              if (branchType !== "1") {
                const tax =
                  parseFloat(item.IGST_Per) ||
                  (parseFloat(item.CGST_Per) +
                    parseFloat(item.SGST_Per) +
                    parseFloat(item.UTGST_Per)) ||
                  0;
                newPurRate = (newPurRate * 100) / (100 + tax);
              }
            }

            if (mrpValue < newPurRate) {
              showToast("New Pur.Price should not be More than MRP.");
              hasError = true;
              return null;
            }

            const qty = parseFloat(item.Qty) || 0;
            const iTaxType = outTaxType === "Inclusive" ? "I" : "E";
            const totalTaxRate = await fetchTaxRate(
              item.HSNCode || "",
              newPurRate, // Updated to use newPurRate instead of mrpValue
              iTaxType,
              item.Itemcode || ""
            );

            let dblCGSTPer = 0;
            let dblSGSTPer = 0;
            let dblIGSTPer = 0;
            let dblUTGSTPer = 0;

            const sourceStateNum = parseInt(
              (sourceStateCode || "").split(" - ")[0] || "0",
              10
            );
            const destStateNum = parseInt(
              (stateCode || "").split(" - ")[0] || "0",
              10
            );

            if (sourceStateNum === destStateNum) {
              dblCGSTPer = totalTaxRate / 2;
              dblSGSTPer = totalTaxRate / 2;
            } else {
              dblIGSTPer = totalTaxRate;
            }

            return {
              id: Date.now().toString() + Math.random(),
              itemCode: item.Itemcode || "",
              hsnSac: item.HSNCode || "",
              oemCode: item.OEMCode || "",
              qty: String(item.Qty),
              itemName: item.ItemDescription || "",
              currentQty: String(item.Qty || 0),
              transferQty: String(item.Qty || 0),
              purPrice: String(item.PurchasePrice || 0),
              newPurPrice: String(item.NewPurPrice),
              mrp: String(item.MRP || 0),
              splMrp: String(item.DiscountPrice || 0),
              tax: String(totalTaxRate),
              taxtype: String(item.Taxtype || 0),
              cgstPercent: (item.CGST_Per),
              cgstAmt: (item.CGST_Amt),
              sgstPercent: (item.SGST_Per),
              sgstAmt: (item.SGST_Amt),
              igstPercent: (item.IGST_Per),
              igstAmt: (item.IGST_Amt),
              utgstPercent: (item.UTGST_Per),
              utgstAmt: (item.UTGST_Amt),
              division: item.Division || "",
              department: item.Department || "",
              category: item.Category || "",
              brand: item.Brand || "",
              style: item.Style || "-",
              design: item.Design || "-",
              size: item.Size || "-",
              vertical:
                item.Verticle1 === "NA" ? "N/A" : item.Verticle1 || "N/A",
            };
          } catch (error) {
            console.error("Error processing item:", error.message);
            return null;
          }
        })
      );

      // Filter out null items
      const filteredItems = items.filter((item) => item !== null);
      if (hasError) {
        setAllItems([]);
      } else {
        const updatedItems = filteredItems.map((item) =>
          calculateTaxDetails(item, outTaxType === "Inclusive" ? "I" : "E", stateCode)
        );
        setAllItems(updatedItems);
        setLastAddedItemId(
          updatedItems.length > 0 ? updatedItems[updatedItems.length - 1].id : null
        );
      }
    } catch (error) {
      console.error("Error fetching Trans No items:", error.message);
      showToast(`Failed to fetch Trans No items: ${error.message}`);
      setAllItems([]);
    } finally {
      setLoading(false);
      itemCodeInputRef.current?.focus();
    }
  };

  // Fetch Source Details
  const fetchSourceDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/api/StockExportToFranchise/api/V1/GetSourceDetails`
      );
      const text = await response.text();
      if (!response.ok) {
        console.error(`HTTP Error: ${response.status} - ${text}`);
        showToast(`Failed to fetch Source details: HTTP ${response.status}`);
        return;
      }
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error(`Non-JSON response: ${text}`);
        showToast("Failed to fetch Source details: Invalid response format");
        return;
      }
      const data = JSON.parse(text);
      if (
        Array.isArray(data) &&
        data.length > 0 &&
        Array.isArray(data[0]) &&
        data[0].length > 0
      ) {
        const sources = data[0][0].map((item) => ({
          id: item["Branch Id"],
          name: item["Branch Name"],
          defwhouse: item["Defwhouse"] === true || item["Defwhouse"] === "true",
          stateCode: `${item.StateCode} - ${item.StateShortName}`,
          branchType: item.BranchType || "",
        }));
        setSourceOptions(sources);
        setFilteredSourceOptions(sources);
        if (sources.length > 0) {
          const defaultSource = sources.find((s) => s.defwhouse) || sources[0];
          setSource(defaultSource.id);
        }
      } else {
        showToast("Unexpected Source response structure");
      }
    } catch (error) {
      console.error("Error fetching Source:", error.message);
      showToast(`Failed to fetch Source details: ${error.message}`);
    } finally {
      setLoading(false);
      itemCodeInputRef.current?.focus();
    }
  };

  // Fetch Destination Details
  const fetchDestinationDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/api/StockExportToFranchise/api/V1/GetDestinationDetails`
      );
      const text = await response.text();
      if (!response.ok) {
        console.error(`HTTP Error: ${response.status} - ${text}`);
        showToast(`Failed to fetch Destination details: HTTP ${response.status}`);
        return;
      }
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error(`Non-JSON response: ${text}`);
        showToast("Failed to fetch Destination details: Invalid response format");
        return;
      }
      const data = JSON.parse(text);
      if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0]) && data[0].length > 0) {
        const destinations = data[0][0].map((item) => ({
          id: item["Branch Id"],
          name: item["Branch Name"],
          stateCode: `${item.StateCode} - ${item.StateShortName}`,
          branchType: item.BranchType || "",
        }));
        setDestinationOptions(destinations);
        setFilteredDestinationOptions(destinations);
      } else {
        showToast("Unexpected Destination response structure");
      }
    } catch (error) {
      console.error("Error fetching Destination:", error.message);
      showToast(`Failed to fetch Destination details: ${error.message}`);
    } finally {
      setLoading(false);
      itemCodeInputRef.current?.focus();
    }
  };

  // async function fetchTaxRate(hsnCode, amount, iTaxType, itemCode) {
  //   try {
  //     // ✅ Validation before hitting API
  //     if (!hsnCode || !itemCode) {
  //       console.warn("HSNCode and ItemCode are required for tax rate API");
  //       return 0;
  //     }

  //     const url = `${API_URL}/api/StockExportToBranch/api/V1/GetGSTPerDetails?HSNCode=${encodeURIComponent(
  //       hsnCode
  //     )}&Amount=${encodeURIComponent(amount)}&ITaxType=${encodeURIComponent(
  //       iTaxType
  //     )}&ItemCode=${encodeURIComponent(itemCode)}&Status=A`;

  //     console.log("Fetching Tax Rate:", url);

  //     const response = await fetch(url);

  //     let data;
  //     try {
  //       data = await response.json();
  //     } catch (e) {
  //       const text = await response.text();
  //       console.error("Invalid JSON response for tax rate:", text);
  //       return 0;
  //     }

  //     if (!response.ok) {
  //       console.error(`HTTP Error: ${response.status}`, data);
  //       if (data.errors) {
  //         Object.entries(data.errors).forEach(([field, messages]) => {
  //           console.error(`Validation error - ${field}: ${messages.join(", ")}`);
  //         });
  //       }
  //       return 0;
  //     }

  //     // ✅ Extract Column1 safely
  //     const column1 =
  //       Array.isArray(data) &&
  //       data[0] &&
  //       data[0][0] &&
  //       data[0][0][0] &&
  //       data[0][0][0].Column1;

  //     return column1 !== undefined && column1 !== null
  //       ? parseFloat(column1) || 0
  //       : 0;
  //   } catch (error) {
  //     console.error("Error fetching tax rate:", error.message);
  //     return 0;
  //   }
  // }

  async function fetchTaxRate(hsnCode, amount, iTaxType, itemCode) {
    try {
      // ✅ Validation before hitting API
      if (!hsnCode || !itemCode) {
        console.warn("HSNCode and ItemCode are required for tax rate API");
        return 0;
      }

      // ✅ Round off the amount before sending to API
      const roundedAmount = Math.round(parseFloat(amount) || 0);

      const url = `${API_URL}/api/StockExportToBranch/api/V1/GetGSTPerDetails?HSNCode=${encodeURIComponent(
        hsnCode
      )}&Amount=${encodeURIComponent(roundedAmount)}&ITaxType=${encodeURIComponent(
        iTaxType
      )}&ItemCode=${encodeURIComponent(itemCode)}&Status=A`;

      console.log("Fetching Tax Rate:", url);

      const response = await fetch(url);

      let data;
      try {
        data = await response.json();
      } catch (e) {
        const text = await response.text();
        console.error("Invalid JSON response for tax rate:", text);
        return 0;
      }

      if (!response.ok) {
        console.error(`HTTP Error: ${response.status}`, data);
        if (data.errors) {
          Object.entries(data.errors).forEach(([field, messages]) => {
            console.error(`Validation error - ${field}: ${messages.join(", ")}`);
          });
        }
        return 0;
      }

      // ✅ Extract Column1 safely
      const column1 =
        Array.isArray(data) &&
        data[0] &&
        data[0][0] &&
        data[0][0][0] &&
        data[0][0][0].Column1;

      return column1 !== undefined && column1 !== null
        ? parseFloat(column1) || 0
        : 0;
    } catch (error) {
      console.error("Error fetching tax rate:", error.message);
      return 0;
    }
  }


  const fetchItemDetails = async (itemCode, isScan = false) => {
    if (!itemCode || !destination) {
      showToast("Please enter Item Code and select Destination");
      setItemDemCode("");
      itemCodeInputRef.current?.focus();
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/StockExportToFranchise/api/V1/GetByIdItemDetails?ItemCode=${itemCode}&Qty=1&DestBranch=${destination}`
      );

      let data;
      try {
        data = await response.json();
      } catch (e) {
        const text = await response.text();
        console.error("Invalid JSON response:", text);
        showToast("Failed to fetch Item details: Invalid response format");
        return;
      }

      if (!response.ok) {
        console.error(`HTTP Error: ${response.status}`, data);
        showToast(`Failed to fetch Item details: HTTP ${response.status}`);
        return;
      }

      const item =
        Array.isArray(data) && data.length > 0
          ? Array.isArray(data[0]) && data[0].length > 0
            ? Array.isArray(data[0][0]) && data[0][0].length > 0
              ? data[0][0][0]
              : data[0][0]
            : data[0]
          : data;

      if (!item || typeof item !== "object") {
        showToast("Unexpected Item details response structure");
        return;
      }

      // Price Calculation
      let newPurRate = 0.0;
      const markName = markupOn;
      const markPer = parseFloat(atPercent) || 0;
      const purchasePrice = parseFloat(item.PurchasePrice) || 0;
      const mrpValue = parseFloat(item.MRP) || 0;
      const discountPrice = parseFloat(item.DiscountPrice) || 0;
      const wsp = parseFloat(item.WSP) || purchasePrice;
      let isMarkUp = false;

      if (markName === "Purchase Price" || markName === "WSP Price") {
        isMarkUp = true;
      } else if (
        markName === "Special MRP" ||
        markName === "Spl MRP with Slab" ||
        markName === "MRP"
      ) {
        isMarkUp = false;
      } else {
        newPurRate = purchasePrice;
      }

      if (isMarkUp) {
        newPurRate = markName === "WSP Price" ? wsp : purchasePrice;
        newPurRate = newPurRate + (newPurRate * markPer) / 100;
      } else {
        let per = markPer;
        if (markName === "Special MRP" || markName === "Spl MRP with Slab") {
          newPurRate = discountPrice;
        } else {
          newPurRate = mrpValue;
        }
        newPurRate = newPurRate - (newPurRate * per) / 100;
        if (branchType !== "1") {
          const tax =
            parseFloat(item.IGST_Per) ||
            (parseFloat(item.CGST_Per) +
              parseFloat(item.SGST_Per) +
              parseFloat(item.UTGST_Per)) ||
            0;
          newPurRate = (newPurRate * 100) / (100 + tax);
        }
      }

      if (mrpValue < newPurRate) {
        showToast("New Pur.Price should not be More than MRP.");
        return;
      }

      // Tax Calculation
      const iTaxType = outTaxType === "Inclusive" ? "I" : "E";
      const totalTaxRate = await fetchTaxRate(
        item.HSNCode || "",
        newPurRate, // Updated to use newPurRate instead of mrpValue
        iTaxType,
        item.Itemcode || ""
      );

      let dblCGSTPer = 0;
      let dblSGSTPer = 0;
      let dblIGSTPer = 0;
      let dblUTGSTPer = 0;

      const sourceStateNum = parseInt(
        (sourceStateCode || "").split(" - ")[0] || "0",
        10
      );
      const destStateNum = parseInt(
        (stateCode || "").split(" - ")[0] || "0",
        10
      );

      if (sourceStateNum === destStateNum) {
        dblCGSTPer = totalTaxRate / 2;
        dblSGSTPer = totalTaxRate / 2;
      } else {
        dblIGSTPer = totalTaxRate;
      }

      // Update or Add Item
      //       setAllItems((prev) => {
      //         const existingItem = prev.find((i) => i.itemCode === item.Itemcode);
      //         const maxQty = parseFloat(item.Qty) || 0;
      // console.log(maxQty);
      //         if (existingItem) {
      //           const currentTransferQty = parseFloat(existingItem.transferQty) || 0;
      //           console.log(currentTransferQty);
      //           const newTransferQty = currentTransferQty + 1;
      // console.log(newTransferQty)
      //           if (newTransferQty > maxQty) {
      //             showToast(
      //               `Item ${item.Itemcode} not available: Transfer quantity (${newTransferQty}) exceeds available quantity (${maxQty})`
      //             );
      //             return prev;
      //           }

      setAllItems((prev) => {
        const existingItem = prev.find((i) => i.itemCode === item.Itemcode);
        const maxQty = parseFloat(item.Qty) || 0;
        console.log("Max Qty:", maxQty);

        if (existingItem) {
          const currentTransferQty = parseFloat(existingItem.transferQty) || 0;
          console.log("Current Transfer Qty:", currentTransferQty);

          let newTransferQty = currentTransferQty + 1;

          // ✅ If integer parts match but maxQty has a decimal remainder, add that decimal part
          if (Math.floor(maxQty) === Math.floor(currentTransferQty) && maxQty > currentTransferQty) {
            const decimalDifference = parseFloat((maxQty - currentTransferQty).toFixed(3));
            newTransferQty = currentTransferQty + decimalDifference;
            console.log("Adjusted Transfer Qty (Decimal Difference):", newTransferQty);
          }

          // Prevent exceeding maxQty
          if (newTransferQty > maxQty) {
            showToast(
              `Item ${item.Itemcode} not available: Transfer quantity (${newTransferQty}) exceeds available quantity (${maxQty})`
            );
            return prev;
          }
          console.log(currentTransferQty);
          console.log(newTransferQty);
          const updatedItems = prev.map((i) => {
            if (i.itemCode === item.Itemcode) {
              const updatedItem = {
                ...i,
                transferQty: newTransferQty.toString(),
                currentQty: String(item.Qty || 0),
                tax: String(totalTaxRate),
                taxtype: iTaxType,
                cgstPercent: String(dblCGSTPer),
                cgstAmt: "0",
                sgstPercent: String(dblSGSTPer),
                sgstAmt: "0",
                igstPercent: String(dblIGSTPer),
                igstAmt: "0",
                utgstPercent: String(dblUTGSTPer),
                utgstAmt: "0",
              };
              return calculateTaxDetails(updatedItem, iTaxType, stateCode);
            }
            return i;
          });
          setLastAddedItemId(existingItem.id);
          return updatedItems;
        } else {
          if (maxQty < 1) {
            showToast(`Item ${item.Itemcode} not available: No stock available`);
            return prev;
          }

          const newItem = {
            id: Date.now().toString(),
            itemCode: item.Itemcode || "",
            hsnSac: item.HSNCode || "",
            oemCode: item.OEMCode || "",
            itemName: item.ItemDescription || "",
            currentQty: String(item.Qty || 0),
            transferQty: "1",
            purPrice: String(item.PurchasePrice || 0),
            newPurPrice: newPurRate.toFixed(2),
            mrp: String(item.MRP || 0),
            splMrp: String(item.DiscountPrice || 0),
            tax: String(totalTaxRate),
            taxtype: iTaxType,
            cgstPercent: String(dblCGSTPer),
            cgstAmt: "0",
            sgstPercent: String(dblSGSTPer),
            sgstAmt: "0",
            igstPercent: String(dblIGSTPer),
            igstAmt: "0",
            utgstPercent: String(dblUTGSTPer),
            utgstAmt: "0",
            division: item.Division || "",
            department: item.Department || "",
            category: item.Category || "",
            brand: item.Brand || "",
            style: item.Style || "-",
            design: item.Design || "-",
            size: item.Size || "-",
            vertical: item.Verticle1 === "NA" ? "N/A" : item.Verticle1 || "",
          };

          const updatedItem = calculateTaxDetails(newItem, iTaxType, stateCode);
          const updatedItems = [...prev, updatedItem];
          setLastAddedItemId(updatedItem.id);
          return updatedItems;
        }
      });

      // Reset Fields
      setItemDemCode("");
      setCurrentQty("");
      setMrp("");
      setSelectedItemCategoryType("");
    } catch (error) {
      console.error("Error fetching Item details:", error.message);
      showToast(`Failed to fetch Item details: ${error.message}`);
    } finally {
      setLoading(false);
      setIsScanning(false);
      itemCodeInputRef.current?.focus();
    }
  };

  const calculateTaxDetails = (item, outTaxType, stateCode) => {
    try {
      let dblMRP = parseFloat(item.mrp) || 0;
      let dblSplMRP = parseFloat(item.splMrp) || 0;
      let dblPurPrice = parseFloat(item.newPurPrice) || 0;

      if (dblSplMRP > 0) {
        dblMRP = dblSplMRP;
      }

      let dblCGSTPer = parseFloat(item.cgstPercent) || 0;
      let dblSGSTPer = parseFloat(item.sgstPercent) || 0;
      let dblIGSTPer = parseFloat(item.igstPercent) || 0;
      let dblUTGSTPer = parseFloat(item.utgstPercent) || 0;

      let dblInTax = dblCGSTPer + dblSGSTPer + dblIGSTPer + dblUTGSTPer;

      let dblCGSTAmt = 0;
      let dblSGSTAmt = 0;
      let dblIGSTAmt = 0;
      let dblUTGSTAmt = 0;

      let strGross = (parseFloat(item.transferQty) || 0) * dblPurPrice;

      if (outTaxType === "I") {
        const taxBase = strGross * (100 / (100 + dblInTax));
        const taxAmount = strGross - taxBase;

        if (dblCGSTPer + dblSGSTPer !== 0) {
          dblCGSTAmt = (taxAmount * dblCGSTPer) / (dblCGSTPer + dblSGSTPer);
          dblSGSTAmt = (taxAmount * dblSGSTPer) / (dblCGSTPer + dblSGSTPer);
        }
        if (dblIGSTPer > 0) {
          dblIGSTAmt = (taxAmount * dblIGSTPer) / dblInTax;
        }
        if (dblUTGSTPer > 0) {
          dblUTGSTAmt = (taxAmount * dblUTGSTPer) / dblInTax;
        }
      } else {
        dblCGSTAmt = (strGross * dblCGSTPer) / 100;
        dblSGSTAmt = (strGross * dblSGSTPer) / 100;
        dblIGSTAmt = (strGross * dblIGSTPer) / 100;
        dblUTGSTAmt = (strGross * dblUTGSTPer) / 100;
      }

      return {
        ...item,
        tax: dblInTax.toFixed(2),
        taxtype: outTaxType,
        cgstPercent: dblCGSTPer.toFixed(2),
        cgstAmt: dblCGSTAmt.toFixed(2),
        sgstPercent: dblSGSTPer.toFixed(2),
        sgstAmt: dblSGSTAmt.toFixed(2),
        igstPercent: dblIGSTPer.toFixed(2),
        igstAmt: dblIGSTAmt.toFixed(2),
        utgstPercent: dblUTGSTPer.toFixed(2),
        utgstAmt: dblUTGSTAmt.toFixed(2),
      };
    } catch (error) {
      console.error("Error calculating tax details:", error.message);
      showToast("Failed to calculate tax details");
      return item;
    }
  };

  // Save Transfer
  // const saveTransfer = async () => {
  //   if (!source || !destination || !outTaxType || allItems.length === 0) {
  //     showToast("Please fill Source, Destination, OutTax Type, and add at least one item");
  //     return;
  //   }
  //   try {
  //     setLoading(true);
  //     const totalRoundOff = parseFloat(roundOff) || 0;
  //     const gstItems = allItems.map((item, index) => ({
  //       itemcode: item.itemCode,
  //       hsnCode: item.hsnSac,
  //       oemCode: item.oemCode || "",
  //       itemDescription: item.itemName,
  //       uomId: index === 0 ? "UM10028" : "UM10002",
  //       qty: parseFloat(item.transferQty) || 0,
  //       purchasePrice: parseFloat(item.purPrice) || 0,
  //       newPurchasePrice: parseFloat(item.newPurPrice) || 0,
  //       mrp: parseFloat(item.mrp) || 0,
  //       discount: 0,
  //       disType: index === 0 ? "P" : "",
  //       discountPrice: parseFloat(item.splMrp) || 0,
  //       division: item.division,
  //       department: item.department,
  //       category: item.category,
  //       subCategory: "NA",
  //       style: item.style,
  //       design: item.design,
  //       size: item.size,
  //       color: "NA",
  //       brand: item.brand,
  //       fabric: "",
  //       artName: item.itemName,
  //       tranNo: "",
  //       tokens: "20",
  //       tax: parseFloat(item.tax) || 0,
  //       taxtype: item.taxtype || (outTaxType === "Inclusive" ? "I" : "E"),
  //       packetNo: "",
  //       counterId: "",
  //       inTax: parseFloat(item.tax) || 0,
  //       inTaxtype: item.taxtype || (outTaxType === "Inclusive" ? "I" : "E"),
  //       supplier: index === 0 ? "" : "SUM10001",
  //       verticle1: item.vertical === "N/A" ? "" : item.vertical,
  //       verticle2: "",
  //       verticle3: "",
  //       // pDistr_Rate: 0,
  //       tokenType: "A",
  //       cgsT_Per: parseFloat(item.cgstPercent) || 0,
  //       cgsT_Amt: parseFloat(item.cgstAmt) || 0,
  //       sgsT_Per: parseFloat(item.sgstPercent) || 0,
  //       sgsT_Amt: parseFloat(item.sgstAmt) || 0,
  //       igsT_Per: parseFloat(item.igstPercent) || 0,
  //       igsT_Amt: parseFloat(item.igstAmt) || 0,
  //       utgsT_Per: parseFloat(item.utgstPercent) || 0,
  //       utgsT_Amt: parseFloat(item.utgstAmt) || 0,
  //       itemDisc: "0",
  //       invDiscPer: "0",
  //       invDiscType: "A",
  //       tcsDiscType: "P",
  //       tcsDiscPer: "0",
  //       tcsDiscount: "0",
  //       tcsItemWiseDisc: "0",
  //       totalRoundOff: totalRoundOff.toFixed(2),
  //       roundOffItemWise: "0.00",
  //       myvalue5: "10",
  //     }));
  //     const payload = {
  //       transNo,
  //       sourceBranch: source,
  //       destBranch: destination,
  //       outTaxType: outTaxType === "Inclusive" ? "I" : "E",
  //       remarks,
  //       taxAmt: parseFloat(taxAmt) || 0,
  //       grossAmount: parseFloat(grossAmount) || 0,
  //       netAmount: parseFloat(netAmount) || 0,
  //       gstItems,
  //     };
  //     console.log(payload);
  //     console.log(JSON.stringify(payload, null, 2));

  //     const response = await fetch(
  //       `${API_URL}/api/StockExportToFranchise/api/V1/Save`,
  //       {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         body: JSON.stringify(payload),
  //       }
  //     );

  //     const text = await response.text();
  //     if (!response.ok) {
  //       console.error(`HTTP Error: ${response.status} - ${text}`);
  //       showToast(`Failed to save transfer: HTTP ${response.status}`);
  //       return;
  //     }

  //     const data = String(text);
  //     showToast(`${data}`);

  //     setTransNo("");
  //     setSource("");
  //     setDestination("");
  //     setRemarks("");
  //     setAllItems([]);
  //     setItemDemCode("");
  //     setCurrentQty("");
  //     setMrp("");
  //     setTotalItems("0");
  //     setTotalExpQty("0");
  //     setMrpValue("0.00");
  //     setTaxAmt("0.00");
  //     setGrossAmount("0.00");
  //     setRoundOff("0.00");
  //     setNetAmount("0.00");
  //     setOutTaxType("Inclusive");
  //     setMarkupOn("");
  //     setAtPercent("");
  //     setSelectedItemCategoryType("");
  //     setLastAddedItemId(null);
  //     await clearUnsavedTransfer();
  //     await fetchSourceDetails();
  //     await fetchTransNoDetails();
  //     itemCodeInputRef.current?.focus();
  //   } catch (error) {
  //     console.error("Error saving transfer:", error.message);
  //     showToast(`Failed to save transfer: ${error.message}`);
  //   } finally {
  //     setLoading(false);
  //     itemCodeInputRef.current?.focus();
  //   }
  // };


  const saveTransfer = async () => {
    if (!source || !destination || !outTaxType || allItems.length === 0) {
      showToast("Please fill Source, Destination, OutTax Type, and add at least one item");
      return;
    }

    // ✅ Show confirmation alert before saving
    Alert.alert(
      "Confirm Save",
      "Do you want to save this transfer?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Save",
          onPress: async () => {
            try {
              setLoading(true);
              const totalRoundOff = parseFloat(roundOff) || 0;

              const gstItems = allItems.map((item, index) => ({
                itemcode: item.itemCode,
                hsnCode: item.hsnSac,
                oemCode: item.oemCode || "",
                itemDescription: item.itemName,
                uomId: index === 0 ? "UM10028" : "UM10002",
                qty: parseFloat(item.transferQty) || 0,
                purchasePrice: parseFloat(item.purPrice) || 0,
                newPurchasePrice: parseFloat(item.newPurPrice) || 0,
                mrp: parseFloat(item.mrp) || 0,
                discount: 0,
                disType: index === 0 ? "P" : "",
                discountPrice: parseFloat(item.splMrp) || 0,
                division: item.division,
                department: item.department,
                category: item.category,
                subCategory: "NA",
                style: item.style,
                design: item.design,
                size: item.size,
                color: "NA",
                brand: item.brand,
                fabric: "",
                artName: item.itemName,
                tranNo: "",
                tokens: "20",
                tax: parseFloat(item.tax) || 0,
                taxtype: item.taxtype || (outTaxType === "Inclusive" ? "I" : "E"),
                packetNo: "",
                counterId: "",
                inTax: parseFloat(item.tax) || 0,
                inTaxtype: item.taxtype || (outTaxType === "Inclusive" ? "I" : "E"),
                supplier: index === 0 ? "" : "SUM10001",
                verticle1: item.vertical === "N/A" ? "" : item.vertical,
                verticle2: "",
                verticle3: "",
                tokenType: "A",
                cgsT_Per: parseFloat(item.cgstPercent) || 0,
                cgsT_Amt: parseFloat(item.cgstAmt) || 0,
                sgsT_Per: parseFloat(item.sgstPercent) || 0,
                sgsT_Amt: parseFloat(item.sgstAmt) || 0,
                igsT_Per: parseFloat(item.igstPercent) || 0,
                igsT_Amt: parseFloat(item.igstAmt) || 0,
                utgsT_Per: parseFloat(item.utgstPercent) || 0,
                utgsT_Amt: parseFloat(item.utgstAmt) || 0,
                itemDisc: "0",
                invDiscPer: "0",
                invDiscType: "A",
                tcsDiscType: "P",
                tcsDiscPer: "0",
                tcsDiscount: "0",
                tcsItemWiseDisc: "0",
                totalRoundOff: totalRoundOff.toFixed(2),
                roundOffItemWise: "0.00",
                myvalue5: "10",
              }));

              const payload = {
                transNo,
                sourceBranch: source,
                destBranch: destination,
                outTaxType: outTaxType === "Inclusive" ? "I" : "E",
                remarks,
                taxAmt: parseFloat(taxAmt) || 0,
                grossAmount: parseFloat(grossAmount) || 0,
                netAmount: parseFloat(netAmount) || 0,
                gstItems,
              };

              console.log(payload);
              console.log(JSON.stringify(payload, null, 2));

              const response = await fetch(`${API_URL}/api/StockExportToFranchise/api/V1/Save`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
              });

              const text = await response.text();
              if (!response.ok) {
                console.error(`HTTP Error: ${response.status} - ${text}`);
                showToast(`Failed to save transfer: HTTP ${response.status}`);
                return;
              }

              const data = String(text);
              showToast(`${data}`);

              // ✅ Reset all fields after successful save
              setTransNo("");
              setSource("");
              setDestination("");
              setRemarks("");
              setAllItems([]);
              setItemDemCode("");
              setCurrentQty("");
              setMrp("");
              setTotalItems("0");
              setTotalExpQty("0");
              setMrpValue("0.00");
              setTaxAmt("0.00");
              setGrossAmount("0.00");
              setRoundOff("0.00");
              setNetAmount("0.00");
              setOutTaxType("Inclusive");
              setMarkupOn("");
              setAtPercent("");
              setSelectedItemCategoryType("");
              setLastAddedItemId(null);
              await clearUnsavedTransfer();
              await fetchSourceDetails();
              await fetchTransNoDetails();
              itemCodeInputRef.current?.focus();
            } catch (error) {
              console.error("Error saving transfer:", error.message);
              showToast(`Failed to save transfer: ${error.message}`);
            } finally {
              setLoading(false);
              itemCodeInputRef.current?.focus();
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  //   const saveTransfer = async () => {
  //   if (!source || !destination || !outTaxType || allItems.length === 0) {
  //     showToast("Please fill Source, Destination, OutTax Type, and add at least one item");
  //     return;
  //   }

  //   try {
  //     setLoading(true);

  //     const totalRoundOff = parseFloat(roundOff) || 0;

  //     const gstItems = allItems.map((item, index) => ({
  //       itemcode: item.itemCode,
  //       hsnCode: item.hsnSac,
  //       oemCode: item.oemCode || "",
  //       itemDescription: item.itemName,
  //       uomId: index === 0 ? "UM10028" : "UM10002",
  //       qty: parseFloat(item.transferQty) || 0,
  //       purchasePrice: parseFloat(item.purPrice) || 0,
  //       newPurchasePrice: parseFloat(item.newPurPrice) || 0,
  //       mrp: parseFloat(item.mrp) || 0,
  //       discount: 0,
  //       disType: index === 0 ? "P" : "",
  //       discountPrice: parseFloat(item.splMrp) || 0,
  //       division: item.division || "",
  //       department: item.department || "",
  //       category: item.category || "",
  //       subCategory: "NA",
  //       style: item.style || "-",
  //       design: item.design || "-",
  //       size: item.size || "",
  //       color: "NA",
  //       brand: item.brand || "",
  //       fabric: "",
  //       artName: item.itemName || "",
  //       tranNo: "",
  //       tokens: "20", // Sent as string because backend expects it that way
  //       tax: parseFloat(item.tax) || 0,
  //       taxtype: item.taxtype || (outTaxType === "Inclusive" ? "I" : "E"),
  //       packetNo: "",
  //       counterId: "",
  //       inTax: parseFloat(item.tax) || 0,
  //       inTaxtype: item.taxtype || (outTaxType === "Inclusive" ? "I" : "E"),
  //       supplier: index === 0 ? "" : "SUM10001",
  //       verticle1: item.vertical === "N/A" ? "" : item.vertical,
  //       verticle2: "",
  //       verticle3: "",
  //       pDistr_Rate: 0,
  //       tokenType: "A",
  //       cgsT_Per: parseFloat(item.cgstPercent) || 0,
  //       cgsT_Amt: parseFloat(item.cgstAmt) || 0,
  //       sgsT_Per: parseFloat(item.sgstPercent) || 0,
  //       sgsT_Amt: parseFloat(item.sgstAmt) || 0,
  //       igsT_Per: parseFloat(item.igstPercent) || 0,
  //       igsT_Amt: parseFloat(item.igstAmt) || 0,
  //       utgsT_Per: parseFloat(item.utgstPercent) || 0,
  //       utgsT_Amt: parseFloat(item.utgstAmt) || 0,
  //       itemDisc: "0",
  //       invDiscPer: "0",
  //       invDiscType: "A",
  //       tcsDiscType: "P",
  //       tcsDiscPer: "0",
  //       tcsDiscount: "0",
  //       tcsItemWiseDisc: "0",
  //       totalRoundOff: totalRoundOff.toFixed(2),
  //       roundOffItemWise: "0.00", // ✅ Required by backend (previously missing)
  //       myvalue5: "10",
  //     }));

  //     const payload = {
  //       transNo,
  //       sourceBranch: source,
  //       destBranch: destination,
  //       outTaxType: outTaxType === "Inclusive" ? "I" : "E",
  //       remarks,
  //       taxAmt: parseFloat(taxAmt) || 0,
  //       grossAmount: parseFloat(grossAmount) || 0,
  //       netAmount: parseFloat(netAmount) || 0,
  //       gstItems,
  //     };

  //     console.log(payload);
  //     console.log(JSON.stringify(payload, null, 2));

  //     const response = await fetch(
  //       `${API_URL}/api/StockExportToFranchise/api/V1/Save`,
  //       {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         body: JSON.stringify(payload),
  //       }
  //     );

  //     const text = await response.text();

  //     if (!response.ok) {
  //       console.error(`HTTP Error: ${response.status} - ${text}`);
  //       showToast(`Failed to save transfer: HTTP ${response.status}`);
  //       return;
  //     }

  //     showToast(`${text}`);

  //     // Clear all fields after successful transfer
  //     setTransNo("");
  //     setSource("");
  //     setDestination("");
  //     setRemarks("");
  //     setAllItems([]);
  //     setItemDemCode("");
  //     setCurrentQty("");
  //     setMrp("");
  //     setTotalItems("0");
  //     setTotalExpQty("0");
  //     setMrpValue("0.00");
  //     setTaxAmt("0.00");
  //     setGrossAmount("0.00");
  //     setRoundOff("0.00");
  //     setNetAmount("0.00");
  //     setOutTaxType("Inclusive");
  //     setMarkupOn("");
  //     setAtPercent("");
  //     setSelectedItemCategoryType("");
  //     setLastAddedItemId(null);

  //     await clearUnsavedTransfer();
  //     await fetchSourceDetails();
  //     await fetchTransNoDetails();
  //     itemCodeInputRef.current?.focus();

  //   } catch (error) {
  //     console.error("Error saving transfer:", error.message);
  //     showToast(`Failed to save transfer: ${error.message}`);
  //   } finally {
  //     setLoading(false);
  //     itemCodeInputRef.current?.focus();
  //   }
  // };


  const clearForm = () => {
    Alert.alert(
      "Confirm",
      "Do you want to clear the form?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "OK",
          onPress: () => {
            setTransNo("");
            setSource("");
            setDestination("");
            setRemarks("");
            setAllItems([]);
            setItemDemCode("");
            setCurrentQty("");
            setMrp("");
            setTotalItems("0");
            setTotalExpQty("0");
            setMrpValue("0.00");
            setTaxAmt("0.00");
            setGrossAmount("0.00");
            setRoundOff("0.00");
            setNetAmount("0.00");
            setOutTaxType("Inclusive");
            setMarkupOn("");
            setAtPercent("");
            setSelectedItemCategoryType("");
            setLastAddedItemId(null);
            showToast("Form cleared");
            clearUnsavedTransfer();
            fetchSourceDetails();
            setShowTransNo(false);
            itemCodeInputRef.current?.focus();
          },
        },
      ],
      { cancelable: true }
    );
  };

  // useEffect(() => {
  //   const totalItemsCount = allItems.length;
  //   const totalQty = allItems.reduce(
  //     (sum, item) => sum + (parseFloat(item.transferQty) || 0),
  //     0
  //   );
  //   const totalMrpValue = allItems.reduce(
  //     (sum, item) =>
  //       sum + (parseFloat(item.mrp) || 0) * (parseFloat(item.transferQty) || 0),
  //     0
  //   );
  //   const totalGross = allItems.reduce(
  //     (sum, item) =>
  //       sum +
  //       (parseFloat(item.newPurPrice) || 0) * (parseFloat(item.transferQty) || 0),
  //     0
  //   );

  //   // Calculate total tax amount only for Exclusive tax type
  //   let totalTaxAmt = 0;
  //   if (outTaxType === "Exclusive") {
  //     totalTaxAmt = allItems.reduce(
  //       (sum, item) => {
  //         const cgstAmt = parseFloat(item.cgstAmt) || 0;
  //         const sgstAmt = parseFloat(item.sgstAmt) || 0;
  //         const igstAmt = parseFloat(item.igstAmt) || 0;
  //         const utgstAmt = parseFloat(item.utgstAmt) || 0;
  //         return sum + cgstAmt + sgstAmt + igstAmt + utgstAmt;
  //       },
  //       0
  //     );
  //   }

  //   const roundOffValue =
  //     Math.round(totalGross + totalTaxAmt) - (totalGross + totalTaxAmt);
  //   let netAmountValue = totalGross + totalTaxAmt + roundOffValue;

  //   const tcsAmt = netAmountValue * (parseFloat(tcsPercent) / 100);
  //   netAmountValue += tcsAmt;

  //   setTotalItems(String(totalItemsCount));
  //   setTotalExpQty(String(totalQty));
  //   setMrpValue(totalMrpValue.toFixed(2));
  //   setGrossAmount(totalGross.toFixed(2));
  //   setTaxAmt(totalTaxAmt.toFixed(2));
  //   setRoundOff(roundOffValue.toFixed(2));
  //   setNetAmount(netAmountValue.toFixed(2));
  // }, [allItems, outTaxType, tcsPercent]);

  useEffect(() => {
    const totalItemsCount = allItems.length;

    const totalQty = allItems.reduce(
      (sum, item) => sum + (parseFloat(item.transferQty) || 0),
      0
    );

    const totalMrpValue = allItems.reduce(
      (sum, item) =>
        sum + (parseFloat(item.mrp) || 0) * (parseFloat(item.transferQty) || 0),
      0
    );

    const totalGross = allItems.reduce(
      (sum, item) =>
        sum +
        (parseFloat(item.newPurPrice) || 0) * (parseFloat(item.transferQty) || 0),
      0
    );

    // ✅ Calculate tax based on Inclusive or Exclusive
    let totalTaxAmt = 0;

    if (outTaxType === "Inclusive") {
      totalTaxAmt = allItems.reduce((sum, item) => {
        const qty = parseFloat(item.transferQty) || 0;
        const rate = parseFloat(item.newPurPrice) || 0;
        const gstRate =
          (parseFloat(item.cgstPer) || 0) +
          (parseFloat(item.sgstPer) || 0) +
          (parseFloat(item.igstPer) || 0) +
          (parseFloat(item.utgstPer) || 0);

        // Extract tax portion from inclusive price
        const taxPart = (rate * gstRate) / (100 + gstRate);
        return sum + taxPart * qty;
      }, 0);
    } else {
      totalTaxAmt = allItems.reduce(
        (sum, item) => {
          const cgstAmt = parseFloat(item.cgstAmt) || 0;
          const sgstAmt = parseFloat(item.sgstAmt) || 0;
          const igstAmt = parseFloat(item.igstAmt) || 0;
          const utgstAmt = parseFloat(item.utgstAmt) || 0;
          return sum + cgstAmt + sgstAmt + igstAmt + utgstAmt;
        },
        0
      );
    }

    const roundOffValue =
      Math.round(totalGross + totalTaxAmt) - (totalGross + totalTaxAmt);

    let netAmountValue = totalGross + totalTaxAmt + roundOffValue;

    const tcsAmt = netAmountValue * (parseFloat(tcsPercent) / 100);
    netAmountValue += tcsAmt;

    setTotalItems(String(totalItemsCount));
    setTotalExpQty(String(totalQty));
    setMrpValue(totalMrpValue.toFixed(2));
    setGrossAmount(totalGross.toFixed(2));
    setTaxAmt(totalTaxAmt.toFixed(2));
    setRoundOff(roundOffValue.toFixed(2));
    setNetAmount(netAmountValue.toFixed(2));
  }, [allItems, outTaxType, tcsPercent]);



  useEffect(() => {
    if (lastAddedItemId && allItems.length > 0) {
      const index = allItems.findIndex(item => item.id === lastAddedItemId);
      if (index >= 0) {
        const offsetY = index * (rowHeights[lastAddedItemId] || 60);
        fixedColumnScrollRef.current?.scrollTo({ y: offsetY, animated: true });
        scrollableColumnsRef.current?.scrollTo({ y: offsetY, animated: true });
      }
    }
  }, [lastAddedItemId, allItems, rowHeights]);

  useEffect(() => {
    const search = transNoSearch.toLowerCase();
    setFilteredTransNoOptions(
      transNoOptions.filter((option) =>
        option.tranNo?.toLowerCase().includes(search) ||
        option.refNo?.toLowerCase().includes(search)
      )
    );
  }, [transNoSearch, transNoOptions]);

  useEffect(() => {
    setFilteredSourceOptions(
      sourceOptions.filter((option) =>
        option.name.toLowerCase().includes(sourceSearch.toLowerCase())
      )
    );
  }, [sourceSearch, sourceOptions]);

  useEffect(() => {
    setFilteredDestinationOptions(
      destinationOptions.filter((option) =>
        option.name.toLowerCase().includes(destinationSearch.toLowerCase())
      )
    );
  }, [destinationSearch, destinationOptions]);

  const handleItemCodeChange = (text) => {
    setItemDemCode(text);
  };

  const handleItemCodeSubmit = () => {
    const enteredCode = itemDemCode.trim();
    if (!enteredCode) {
      showToast("Please enter an Item Code or OEM Code");
      return;
    }

    setItemDemCode(enteredCode);
    setIsScanning(false);
    fetchItemDetails(enteredCode);
  };

  useEffect(() => {
    if (itemDemCode) {
      const selectedItem = itemCodeOptions.find(
        (item) => item.id === itemDemCode || item.Oem_code === itemDemCode
      );
      if (selectedItem) {
        setMrp(selectedItem.mrp || "");
        setSelectedItemCategoryType(selectedItem.categoryType || "");

        const existingItem = allItems.find((item) => item.itemCode === selectedItem.id);
        const maxQty = parseFloat(selectedItem.currentQty) || 0;
        const adjustedQty = existingItem
          ? Math.max(0, maxQty - (parseFloat(existingItem.transferQty) || 0))
          : maxQty;
        setCurrentQty(String(adjustedQty));

        if (isScanning) {
          setAllItems((prev) => {
            if (existingItem) {
              const currentTransferQty = parseFloat(existingItem.transferQty) || 0;
              const newTransferQty = currentTransferQty + 1;

              if (newTransferQty > maxQty) {
                showToast(
                  `Item ${selectedItem.id} not available: Transfer quantity (${newTransferQty}) exceeds available quantity (${maxQty})`
                );
                return prev;
              }

              const updatedItems = prev.map((item) => {
                if (item.itemCode === selectedItem.id) {
                  const updatedItem = { ...item, transferQty: newTransferQty.toString() };
                  return calculateTaxDetails(
                    updatedItem,
                    outTaxType === "Inclusive" ? "I" : "E",
                    stateCode
                  );
                }
                return item;
              });
              setLastAddedItemId(existingItem.id);
              return updatedItems;
            } else {
              if (maxQty < 1) {
                showToast(`Item ${selectedItem.id} not available: No stock available`);
                return prev;
              }

              fetchItemDetails(selectedItem.id).then(() => {
                setAllItems((prevItems) => {
                  const newItem = prevItems.find((item) => item.itemCode === selectedItem.id);
                  if (newItem) {
                    setLastAddedItemId(newItem.id);
                  }
                  return prevItems;
                });
              });
              return prev;
            }
          });

          setIsScanning(false);
          setItemDemCode("");
          setCurrentQty("");
          itemCodeInputRef.current?.focus();
        } else {
          itemCodeInputRef.current?.focus();
        }
      } else {
        setMrp("");
        setCurrentQty("");
        setSelectedItemCategoryType("");
      }
    }
  }, [itemDemCode, itemCodeOptions, allItems, isScanning]);

  useEffect(() => {
    if (destination) {
      fetchMarkupDetails(destination);
    } else {
      setMarkupOptions([{ label: "Select Markup", value: "" }]);
      setMarkupOn("");
      setAtPercent("");
    }
  }, [destination]);

  useEffect(() => {
    fetchTransNoDetails();
    fetchSourceDetails();
    fetchDestinationDetails();
    restoreUnsavedTransfer();
  }, []);

  useEffect(() => {
    itemCodeInputRef.current?.focus();
    itemCodeInputRef.current?.blur();
  }, []);

  useEffect(() => {
    const selectedDestination = destinationOptions.find(
      (dest) => dest.id === destination
    );
    setStateCode(selectedDestination ? selectedDestination.stateCode : "");
    setBranchType(selectedDestination ? selectedDestination.branchType : "");
  }, [destination, destinationOptions]);

  useEffect(() => {
    const selectedSource = sourceOptions.find(
      (src) => src.id === source
    );
    setSourceStateCode(selectedSource ? selectedSource.stateCode : "");
  }, [source, sourceOptions]);

  const handleBack = () => {
    onBack();
    return true;
  };

  useEffect(() => {
    BackHandler.addEventListener("hardwareBackPress", handleBack);
    return () => {
      BackHandler.removeEventListener("hardwareBackPress", handleBack);
    };
  }, []);

  const onRowLayout = (id, event) => {
    const { height } = event.nativeEvent.layout;
    setRowHeights((prev) => ({
      ...prev,
      [id]: Math.max(prev[id] || 50, height),
    }));
  };

  const syncScroll = (sourceRef, targetRef, offset) => {
    if (!isScrolling.current) {
      isScrolling.current = true;
      if (targetRef.current && sourceRef.current !== targetRef.current) {
        targetRef.current.scrollTo({
          y: offset,
          animated: false,
        });
      }
      setTimeout(() => {
        isScrolling.current = false;
      }, 0);
    }
  };

  const handleFixedScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    syncScroll(fixedColumnScrollRef, scrollableColumnsRef, offsetY);
  };

  const handleScrollableScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    syncScroll(scrollableColumnsRef, fixedColumnScrollRef, offsetY);
  };

  const handleToggleTransNo = () => {
    setShowTransNo((prev) => {
      const newState = !prev;
      if (newState) {
        setIsTransNoModalOpen(true);
        itemCodeInputRef.current?.focus();
      }
      return newState;
    });
  };

  const handleItemCodeTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      tapCount.current += 1;
    } else {
      tapCount.current = 1;
    }

    lastTap.current = now;

    if (tapCount.current === 2) {
      itemCodeInputRef.current?.focus();
      tapCount.current = 0;
    }
  };

  const handleBarcodeScan = (data) => {
    const scannedCode = String(data.code || data).trim();
    if (!scannedCode) {
      showToast("Invalid barcode scan");
      setShowScanner(false);
      itemCodeInputRef.current?.focus();
      return;
    }

    setIsScanning(true);
    setItemDemCode(scannedCode);
    fetchItemDetails(scannedCode, true);
  };

  const renderTransNoItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.tableRow}
      key={`${item.tranNo}-${index}`}
      onPress={() => {
        setTransNo(item.tranNo);
        setIsTransNoModalOpen(false);
        setTransNoSearch("");
        const toBranch = item.toBranch || "";

        if (toBranch) {
          const destOption = destinationOptions.find(d => d.name === toBranch);
          if (destOption) {
            setDestination(destOption.id);
            fetchTransNoItems(item.tranNo, destOption.id);
          } else {
            showToast("Invalid destination branch from Trans No");
            setIsDestinationModalOpen(true);
          }
        } else {
          setIsDestinationModalOpen(true);
        }
      }}
    >
      <Text style={styles.rowText}>{String(item.tranNo ?? "")}</Text>
      <Text style={styles.rowText}>{String(item.refNo ?? "")}</Text>
    </TouchableOpacity>
  );

  const renderSourceItem = ({ item }) => (
    <TouchableOpacity
      style={styles.modalItem}
      onPress={() => {
        setSource(item.id);
        setIsSourceModalOpen(false);
        setSourceSearch("");
        itemCodeInputRef.current?.focus();
      }}
    >
      <Text style={styles.modalItemText}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderDestinationItem = ({ item }) => (
    <TouchableOpacity
      style={styles.modalItem}
      onPress={() => {
        setDestination(item.id);
        setIsDestinationModalOpen(false);
        setDestinationSearch("");
        setTransNo("");
        setAllItems([]);
        itemCodeInputRef.current?.focus();
      }}
    >
      <Text style={styles.modalItemText}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderOutTaxItem = ({ item }) => (
    <TouchableOpacity
      style={styles.modalItem}
      onPress={() => {
        if (item.value === "") return;
        const prevOutTaxType = outTaxType;
        const newOutTaxType = item.value;

        if (prevOutTaxType !== newOutTaxType && allItems.length > 0) {
          Alert.alert(
            "Confirm",
            "Existing Branch wise GST's Calculated! Do you want to change GST's also?",
            [
              {
                text: "No",
                style: "cancel",
                onPress: () => {
                  itemCodeInputRef.current?.focus();
                },
              },
              {
                text: "Yes",
                onPress: () => {
                  setOutTaxType(newOutTaxType);
                  setIsOutTaxModalOpen(false);
                  const updatedItems = allItems.map((i) =>
                    calculateTaxDetails(i, newOutTaxType === "Inclusive" ? "I" : "E", stateCode)
                  );
                  setAllItems(updatedItems);
                  itemCodeInputRef.current?.focus();
                },
              },
            ],
            { cancelable: true }
          );
        } else {
          setOutTaxType(newOutTaxType);
          setIsOutTaxModalOpen(false);
          itemCodeInputRef.current?.focus();
        }
      }}
    >
      <Text style={styles.modalItemText}>{item.label}</Text>
    </TouchableOpacity>
  );

  const renderMarkupItem = ({ item }) => (
    <TouchableOpacity
      style={styles.modalItem}
      onPress={() => {
        setMarkupOn(item.value);
        setAtPercent(item.markPer || "");
        setIsMarkupModalOpen(false);
        itemCodeInputRef.current?.focus();
      }}
    >
      <Text style={styles.modalItemText}>{item.label}</Text>
    </TouchableOpacity>
  );

  const outTaxOptions = [
    { label: "Select Tax Type", value: "" },
    { label: "Inclusive", value: "Inclusive" },
    { label: "Exclusive", value: "Exclusive" },
  ];

  const handleRowPress = (item) => {
    setEditingItemId(item.id);
    setEditQty(item.transferQty);
    setIsEditQtyModalOpen(true);
  };

  const handleUpdateQty = () => {
    const newQty = parseFloat(editQty);
    if (isNaN(newQty) || newQty <= 0) {
      showToast("Invalid quantity");
      return;
    }

    const updatedItems = allItems.map((i) => {
      if (i.id === editingItemId) {
        const maxQty = parseFloat(i.currentQty) || 0;
        const finalQty = newQty;

        if (finalQty > maxQty) {
          showToast(`Quantity cannot exceed available ${maxQty}`);
          return i;
        }

        const updatedItem = { ...i, transferQty: finalQty.toString() };
        return calculateTaxDetails(
          updatedItem,
          outTaxType === "Inclusive" ? "I" : "E",
          stateCode
        );
      }
      return i;
    });

    setAllItems(updatedItems);
    setIsEditQtyModalOpen(false);
    setEditQty("");
    setEditingItemId(null);
  };

  const handleDelete = (id) => {
    Alert.alert(
      "Confirm",
      "Do you want to delete this row?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "OK",
          onPress: () => {
            setAllItems((prev) => prev.filter((i) => i.id !== id));
            showToast("Row deleted");
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Franchise Transfer</Text>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2E7D32" />
        </View>
      )}

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Transfer Details</Text>

          {showTransNo && (
            <View style={styles.formRow}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Trans No.:</Text>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => setIsTransNoModalOpen(true)}
                  disabled={loading}
                >
                  <Text style={styles.inputText}>
                    {transNo || "Select Trans No"}
                  </Text>
                </TouchableOpacity>
                <Modal
                  visible={isTransNoModalOpen}
                  animationType="slide"
                  transparent={true}
                  onRequestClose={() => {
                    setIsTransNoModalOpen(false);
                    setTransNoSearch("");
                    setTimeout(() => transNoInputRef.current?.focus(), 100);
                  }}
                >
                  <TouchableWithoutFeedback
                    onPress={() => {
                      setIsTransNoModalOpen(false);
                      setTransNoSearch("");
                      setTimeout(() => transNoInputRef.current?.focus(), 100);
                    }}
                  >
                    <View style={styles.modalOverlay}>
                      <View style={styles.modalContent}>
                        <TextInput
                          style={styles.modalSearchInput}
                          ref={transNoInputRef}
                          value={transNoSearch}
                          onChangeText={setTransNoSearch}
                          placeholder="Search Trans No"
                          placeholderTextColor="#999"
                          autoFocus={true}
                        />
                        <FlatList
                          data={filteredTransNoOptions}
                          renderItem={renderTransNoItem}
                          keyExtractor={(item, index) => `${item.tranNo || item.id}-${index}`}
                        />
                      </View>
                    </View>
                  </TouchableWithoutFeedback>
                </Modal>
              </View>
            </View>
          )}

          <View style={styles.formRow}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Source:</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setIsSourceModalOpen(true)}
                disabled={loading}
              >
                <Text style={styles.inputText}>
                  {sourceOptions.find((s) => s.id === source)?.name || "Select Source"}
                </Text>
              </TouchableOpacity>
              <Modal
                visible={isSourceModalOpen}
                animationType="slide"
                transparent={true}
                onRequestClose={() => {
                  setIsSourceModalOpen(false);
                  setSourceSearch("");
                  setTimeout(() => itemCodeInputRef.current?.focus(), 100);
                }}
              >
                <TouchableWithoutFeedback
                  onPress={() => {
                    setIsSourceModalOpen(false);
                    setSourceSearch("");
                    setTimeout(() => itemCodeInputRef.current?.focus(), 100);
                  }}
                >
                  <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                      <TextInput
                        style={styles.modalSearchInput}
                        value={sourceSearch}
                        onChangeText={setSourceSearch}
                        placeholder="Search Source"
                        placeholderTextColor="#999"
                      />
                      <FlatList
                        data={filteredSourceOptions}
                        renderItem={renderSourceItem}
                        keyExtractor={(item) => item.id}
                        style={styles.modalList}
                      />
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              </Modal>
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Destination:</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setIsDestinationModalOpen(true)}
                disabled={loading}
              >
                <Text style={styles.inputText}>
                  {destinationOptions.find((d) => d.id === destination)?.name || "Select Destination"}
                </Text>
              </TouchableOpacity>
              <Modal
                visible={isDestinationModalOpen}
                animationType="slide"
                transparent={true}
                onRequestClose={() => {
                  setIsDestinationModalOpen(false);
                  setDestinationSearch("");
                  setTimeout(() => itemCodeInputRef.current?.focus(), 100);
                }}
              >
                <TouchableWithoutFeedback
                  onPress={() => {
                    setIsDestinationModalOpen(false);
                    setDestinationSearch("");
                    setTimeout(() => itemCodeInputRef.current?.focus(), 100);
                  }}
                >
                  <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                      <TextInput
                        style={styles.modalSearchInput}
                        value={destinationSearch}
                        onChangeText={setDestinationSearch}
                        placeholder="Search Destination"
                        placeholderTextColor="#999"
                      />
                      <FlatList
                        data={filteredDestinationOptions}
                        renderItem={renderDestinationItem}
                        keyExtractor={(item) => item.id}
                        style={styles.modalList}
                      />
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              </Modal>
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>OutTax Type:</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setIsOutTaxModalOpen(true)}
              >
                <Text style={styles.inputText}>
                  {outTaxType || "Select Tax Type"}
                </Text>
              </TouchableOpacity>
              <Modal
                visible={isOutTaxModalOpen}
                animationType="slide"
                transparent={true}
                onRequestClose={() => {
                  setIsOutTaxModalOpen(false);
                  setTimeout(() => itemCodeInputRef.current?.focus(), 100);
                }}
              >
                <TouchableWithoutFeedback
                  onPress={() => {
                    setIsOutTaxModalOpen(false);
                    setTimeout(() => itemCodeInputRef.current?.focus(), 100);
                  }}
                >
                  <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                      <FlatList
                        data={outTaxOptions}
                        renderItem={renderOutTaxItem}
                        keyExtractor={(item) => item.value}
                        style={styles.modalList}
                      />
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              </Modal>
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, { width: isSmallScreen ? '100%' : wp(30) }]}>
              <Text style={styles.label}>Item Code:</Text>
              <View style={styles.itemCodeContainer}>
                <TextInput
                  ref={itemCodeInputRef}
                  style={[styles.input, { flex: 1, color: '#333' }]}
                  value={itemDemCode}
                  onChangeText={handleItemCodeChange}
                  onSubmitEditing={handleItemCodeSubmit}
                  placeholder="Enter Item Code or OEM Code"
                  placeholderTextColor="#999"
                  selectTextOnFocus={true}
                  onTouchStart={handleItemCodeTap}
                  disabled={loading}
                  blurOnSubmit={false}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  style={styles.scanButton}
                  onPress={() => setShowScanner(true)}
                  disabled={loading}
                >
                  <Icon name="qr-code-scanner" size={24} color="white" />
                </TouchableOpacity>
              </View>
              {showScanner && (
                <Modal
                  visible={showScanner}
                  transparent={true}
                  animationType="slide"
                  onRequestClose={() => {
                    setShowScanner(false);
                    setTimeout(() => itemCodeInputRef.current?.focus(), 100);
                  }}
                >
                  <View style={styles.scannerModalContainer}>
                    <BarcodeScanner
                      visible={showScanner}
                      onScan={handleBarcodeScan}
                      onClose={() => {
                        setShowScanner(false);
                        setTimeout(() => itemCodeInputRef.current?.focus(), 100);
                      }}
                    />
                  </View>
                </Modal>
              )}
            </View>
          </View>
        </View>

        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>Items to Transfer</Text>
          <View style={styles.tableOuterContainer}>
            <View style={styles.fixedColumnContainer}>
              <View style={[styles.tableHeader, styles.fixedHeader]}>
                <View style={[styles.headerCell, styles.itemCodeCell]}>
                  <Text style={styles.headerText}>Item Code</Text>
                </View>
              </View>
              <ScrollView
                ref={fixedColumnScrollRef}
                style={styles.fixedColumnScroll}
                scrollEventThrottle={16}
                onScroll={handleFixedScroll}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
              >
                {allItems.map((item, index) => (
                  <TouchableOpacity
                    key={`fixed-${item.id}`}
                    style={[
                      styles.tableCell,
                      styles.itemCodeCell,
                      {
                        backgroundColor: item.id === lastAddedItemId ? "#fff9c4" : index % 2 === 0 ? "#fff" : "#f9f9f9",
                        height: rowHeights[item.id] || 60,
                      },
                    ]}
                    onLayout={(event) => onRowLayout(item.id, event)}
                    onPress={() => handleRowPress(item)}
                    onLongPress={() => handleDelete(item.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cellText}>{item.itemCode}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <ScrollView
              horizontal
              style={styles.scrollableColumnsContainer}
              showsHorizontalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              <View style={styles.scrollableContent}>
                <View style={styles.tableHeader}>
                  <View style={[styles.headerCell, styles.qtyCell]}>
                    <Text style={styles.headerText}>Trans Qty</Text>
                  </View>
                  <View style={[styles.headerCell, styles.qtyCell]}>
                    <Text style={styles.headerText}>Cur Qty</Text>
                  </View>
                  <View style={[styles.headerCell, styles.hsnCell]}>
                    <Text style={styles.headerText}>HSN/SAC</Text>
                  </View>
                  <View style={[styles.headerCell, styles.oemCell]}>
                    <Text style={styles.headerText}>OEM Code</Text>
                  </View>
                  <View style={[styles.headerCell, styles.itemNameCell]}>
                    <Text style={styles.headerText}>Item Name</Text>
                  </View>
                  <View style={[styles.headerCell, styles.priceCell]}>
                    <Text style={styles.headerText}>Pur Price</Text>
                  </View>
                  <View style={[styles.headerCell, styles.priceCell]}>
                    <Text style={styles.headerText}>New Pur Price</Text>
                  </View>
                  <View style={[styles.headerCell, styles.priceCell]}>
                    <Text style={styles.headerText}>MRP</Text>
                  </View>
                  <View style={[styles.headerCell, styles.priceCell]}>
                    <Text style={styles.headerText}>Spl MRP</Text>
                  </View>
                  <View style={[styles.headerCell, styles.priceCell]}>
                    <Text style={styles.headerText}>Tax(%)</Text>
                  </View>
                  <View style={[styles.headerCell, styles.priceCell]}>
                    <Text style={styles.headerText}>Tax type</Text>
                  </View>
                  <View style={[styles.headerCell, styles.taxCell]}>
                    <Text style={styles.headerText}>CGST %</Text>
                  </View>
                  <View style={[styles.headerCell, styles.taxCell]}>
                    <Text style={styles.headerText}>CGST Amt</Text>
                  </View>
                  <View style={[styles.headerCell, styles.taxCell]}>
                    <Text style={styles.headerText}>SGST %</Text>
                  </View>
                  <View style={[styles.headerCell, styles.taxCell]}>
                    <Text style={styles.headerText}>SGST Amt</Text>
                  </View>
                  <View style={[styles.headerCell, styles.taxCell]}>
                    <Text style={styles.headerText}>IGST %</Text>
                  </View>
                  <View style={[styles.headerCell, styles.taxCell]}>
                    <Text style={styles.headerText}>IGST Amt</Text>
                  </View>
                  <View style={[styles.headerCell, styles.taxCell]}>
                    <Text style={styles.headerText}>UTGST %</Text>
                  </View>
                  <View style={[styles.headerCell, styles.taxCell]}>
                    <Text style={styles.headerText}>UTGST Amt</Text>
                  </View>
                  <View style={[styles.headerCell, styles.categoryCell]}>
                    <Text style={styles.headerText}>Division</Text>
                  </View>
                  <View style={[styles.headerCell, styles.categoryCell]}>
                    <Text style={styles.headerText}>Department</Text>
                  </View>
                  <View style={[styles.headerCell, styles.categoryCell]}>
                    <Text style={styles.headerText}>Category</Text>
                  </View>
                  <View style={[styles.headerCell, styles.categoryCell]}>
                    <Text style={styles.headerText}>Brand</Text>
                  </View>
                  <View style={[styles.headerCell, styles.categoryCell]}>
                    <Text style={styles.headerText}>Style</Text>
                  </View>
                  <View style={[styles.headerCell, styles.categoryCell]}>
                    <Text style={styles.headerText}>Design</Text>
                  </View>
                  <View style={[styles.headerCell, styles.categoryCell]}>
                    <Text style={styles.headerText}>Size</Text>
                  </View>
                  <View style={[styles.headerCell, styles.categoryCell]}>
                    <Text style={styles.headerText}>Vertical</Text>
                  </View>
                </View>

                <ScrollView
                  ref={scrollableColumnsRef}
                  style={styles.scrollableDataContainer}
                  scrollEventThrottle={16}
                  onScroll={handleScrollableScroll}
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                >
                  {allItems.map((item, index) => (
                    <TouchableOpacity
                      key={`scrollable-${item.id}`}
                      style={[
                        styles.tableRow,
                        {
                          backgroundColor: item.id === lastAddedItemId ? "#fff9c4" : index % 2 === 0 ? "#fff" : "#f9f9f9",
                          height: rowHeights[item.id] || 60,
                        },
                      ]}
                      onLayout={(event) => onRowLayout(item.id, event)}
                      onPress={() => handleRowPress(item)}
                      onLongPress={() => handleDelete(item.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.tableCell, styles.qtyCell]}>
                        <Text style={styles.cellText}>{item.transferQty}</Text>
                      </View>
                      <View style={[styles.tableCell, styles.qtyCell]}>
                        <Text style={styles.cellText}>{item.currentQty}</Text>
                      </View>
                      <View style={[styles.tableCell, styles.hsnCell]}>
                        <Text style={styles.cellText}>{item.hsnSac}</Text>
                      </View>
                      <View style={[styles.tableCell, styles.oemCell]}>
                        <Text style={styles.cellText}>{item.oemCode || "-"}</Text>
                      </View>
                      <View style={[styles.tableCell, styles.itemNameCell]}>
                        <Text style={styles.cellText} numberOfLines={2}>
                          {item.itemName}
                        </Text>
                      </View>
                      <View style={[styles.tableCell, styles.priceCell]}>
                        <Text style={styles.cellText}>{item.purPrice}</Text>
                      </View>
                      <View style={[styles.tableCell, styles.priceCell]}>
                        <Text style={styles.cellText}>{item.newPurPrice}</Text>
                      </View>
                      <View style={[styles.tableCell, styles.priceCell]}>
                        <Text style={styles.cellText}>{item.mrp}</Text>
                      </View>
                      <View style={[styles.tableCell, styles.priceCell]}>
                        <Text style={styles.cellText}>{item.splMrp}</Text>
                      </View>
                      <View style={[styles.tableCell, styles.priceCell]}>
                        <Text style={styles.cellText}>{item.tax}</Text>
                      </View>
                      <View style={[styles.tableCell, styles.priceCell]}>
                        <Text style={styles.cellText}>{item.taxtype}</Text>
                      </View>
                      <View style={[styles.tableCell, styles.taxCell]}>
                        <Text style={styles.cellText}>{item.cgstPercent}</Text>
                      </View>
                      <View style={[styles.tableCell, styles.taxCell]}>
                        <Text style={styles.cellText}>{item.cgstAmt}</Text>
                      </View>
                      <View style={[styles.tableCell, styles.taxCell]}>
                        <Text style={styles.cellText}>{item.sgstPercent}</Text>
                      </View>
                      <View style={[styles.tableCell, styles.taxCell]}>
                        <Text style={styles.cellText}>{item.sgstAmt}</Text>
                      </View>
                      <View style={[styles.tableCell, styles.taxCell]}>
                        <Text style={styles.cellText}>{item.igstPercent}</Text>
                      </View>
                      <View style={[styles.tableCell, styles.taxCell]}>
                        <Text style={styles.cellText}>{item.igstAmt}</Text>
                      </View>
                      <View style={[styles.tableCell, styles.taxCell]}>
                        <Text style={styles.cellText}>{item.utgstPercent}</Text>
                      </View>
                      <View style={[styles.tableCell, styles.taxCell]}>
                        <Text style={styles.cellText}>{item.utgstAmt}</Text>
                      </View>
                      <View style={[styles.tableCell, styles.categoryCell]}>
                        <Text style={styles.cellText}>{item.division}</Text>
                      </View>
                      <View style={[styles.tableCell, styles.categoryCell]}>
                        <Text style={styles.cellText}>{item.department}</Text>
                      </View>
                      <View style={[styles.tableCell, styles.categoryCell]}>
                        <Text style={styles.cellText}>{item.category}</Text>
                      </View>
                      <View style={[styles.tableCell, styles.categoryCell]}>
                        <Text style={styles.cellText}>{item.brand}</Text>
                      </View>
                      <View style={[styles.tableCell, styles.categoryCell]}>
                        <Text style={styles.cellText}>{item.style}</Text>
                      </View>
                      <View style={[styles.tableCell, styles.categoryCell]}>
                        <Text style={styles.cellText}>{item.design}</Text>
                      </View>
                      <View style={[styles.tableCell, styles.categoryCell]}>
                        <Text style={styles.cellText}>{item.size}</Text>
                      </View>
                      <View style={[styles.tableCell, styles.categoryCell]}>
                        <Text style={styles.cellText}>{item.vertical}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </ScrollView>
          </View>
        </View>

        <View style={styles.totalsSection}>
          <View style={styles.totalsGrid}>
            <View style={styles.totalItem}>
              <Text style={styles.totalLabel}>Total Items</Text>
              <Text style={styles.totalValue}>{totalItems}</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={styles.totalLabel}>Total TransQty</Text>
              <Text style={styles.totalValue}>{totalExpQty}</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={styles.totalLabel}>MRP Value</Text>
              <Text style={styles.totalValue}>₹{mrpValue}</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={styles.totalLabel}>TCS %</Text>
              <Text style={styles.totalValue}>{tcsPercent}%</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={styles.totalLabel}>Gross Amount</Text>
              <Text style={styles.totalValue}>₹{grossAmount}</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={styles.totalLabel}>Tax Amount</Text>
              <Text style={styles.totalValue}>₹{taxAmt}</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={styles.totalLabel}>Round Off</Text>
              <Text style={styles.totalValue}>₹{roundOff}</Text>
            </View>
            <View style={[styles.totalItem, styles.netTotalItem]}>
              <Text style={[styles.totalLabel, styles.netTotalLabel]}>Net Amount</Text>
              <Text style={[styles.totalValue, styles.netTotalValue]}>₹{netAmount}</Text>
            </View>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: transNo !== "" ? "#cccccc" : "#4caf50" },
            ]}
            onPress={saveTransfer}
            disabled={transNo !== "" || loading}
          >
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.showButton} onPress={handleToggleTransNo}>
            <Text style={styles.buttonText}>
              {showTransNo ? "Hide" : "Show"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.clearButton} onPress={clearForm} disabled={loading}>
            <Text style={styles.buttonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={isEditQtyModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setIsEditQtyModalOpen(false);
          setEditQty("");
          setEditingItemId(null);
        }}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            setIsEditQtyModalOpen(false);
            setEditQty("");
            setEditingItemId(null);
          }}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.sectionTitle}>Edit Quantity</Text>
                <TextInput
                  style={styles.input}
                  value={editQty}
                  onChangeText={setEditQty}
                  keyboardType="numeric"
                  placeholder="Enter new quantity"
                  placeholderTextColor="#999"
                />
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleUpdateQty}
                >
                  <Text style={styles.buttonText}>OK</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2E7D32",
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    elevation: 4,
    paddingTop: 40,
  },
  title: {
    color: "white",
    fontSize: isTablet ? 22 : 18,
    fontWeight: "bold",
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: hp(4),
  },
  formSection: {
    backgroundColor: "white",
    margin: wp(3),
    padding: wp(4),
    borderRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: hp(2),
  },
  formRow: {
    flexDirection: isSmallScreen ? "column" : "row",
    marginBottom: hp(2),
  },
  formGroup: {
    flex: 1,
    marginRight: isSmallScreen ? 0 : wp(3),
    marginBottom: isSmallScreen ? hp(1.5) : 0,
  },
  label: {
    marginBottom: hp(0.5),
    fontWeight: "600",
    color: "#555",
    fontSize: isSmallScreen ? 12 : 14,
  },
  input: {
    backgroundColor: "white",
    padding: wp(3),
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    fontSize: isSmallScreen ? 13 : 14,
    minHeight: hp(5.5),
    justifyContent: "center",
    color: '#333'
  },
  inputText: {
    color: "#333",
    fontSize: isSmallScreen ? 13 : 14,
  },
  disabledInput: {
    backgroundColor: "#f5f5f5",
    color: "#666",
  },
  itemCodeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  scanButton: {
    backgroundColor: "#2196f3",
    padding: wp(2.5),
    borderRadius: 8,
    marginLeft: wp(2),
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
  scannerModalContainer: {
    flex: 1,
    width: '50%',
    height: '50%',
    alignItems: "center",
    justifyContent: "center",
    left: "25%",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    width: wp(80),
    maxHeight: hp(60),
    padding: wp(4),
    elevation: 5,
  },
  modalSearchInput: {
    backgroundColor: "white",
    padding: wp(3),
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    fontSize: isSmallScreen ? 13 : 14,
    marginBottom: hp(1),
    color: "#333"
  },
  modalList: {
    flexGrow: 0,
  },
  modalItem: {
    padding: wp(3),
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalItemText: {
    fontSize: isSmallScreen ? 13 : 14,
    color: "#333",
    fontWeight: "600",
    textAlign: "center",
  },
  percentGroup: {
    flex: 0.5,
    marginRight: isSmallScreen ? 0 : wp(3),
    marginBottom: isSmallScreen ? hp(1.5) : 0,
  },
  percentInput: {
    backgroundColor: "white",
    padding: wp(3),
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    textAlign: "center",
    fontSize: isSmallScreen ? 13 : 14,
    minHeight: hp(5.5),
    color: '#333',
  },
  addButton: {
    backgroundColor: "#ff9800",
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(6),
    borderRadius: 20,
    alignItems: "center",
    elevation: 3,
    alignSelf: "center",
    minWidth: isSmallScreen ? "80%" : wp(25),
  },
  itemsSection: {
    backgroundColor: "white",
    margin: wp(3),
    marginTop: 0,
    padding: wp(4),
    borderRadius: 12,
    elevation: 2,
  },
  tableOuterContainer: {
    flexDirection: "row",
    height: hp(35),
    marginTop: hp(1),
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    overflow: "hidden",
  },
  fixedColumnContainer: {
    width: wp(30),
    backgroundColor: "white",
    borderRightWidth: 2,
    borderRightColor: "#ddd",
  },
  fixedColumnScroll: {
    flex: 1,
  },
  scrollableColumnsContainer: {
    flex: 1,
  },
  scrollableContent: {
    flex: 1,
  },
  scrollableDataContainer: {
    flex: 1,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#2E7D32",
    height: 50,
    alignItems: "center",
  },
  fixedHeader: {
    backgroundColor: "#2E7D32",
    borderRightWidth: 2,
    borderRightColor: "#fff",
  },
  headerCell: {
    paddingHorizontal: 8,
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.3)",
    height: 50,
  },
  headerText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    minHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  tableCell: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: "#f0f0f0",
    minHeight: 60,
  },
  cellText: {
    fontSize: 12,
    color: "#333",
    textAlign: "center",
  },
  itemCodeCell: {
    width: wp(28),
    paddingHorizontal: 6,
  },
  hsnCell: {
    width: 80,
  },
  oemCell: {
    width: 100,
  },
  itemNameCell: {
    width: 180,
  },
  qtyCell: {
    width: 70,
  },
  priceCell: {
    width: 90,
  },
  taxCell: {
    width: 70,
  },
  categoryCell: {
    width: 100,
  },
  totalsSection: {
    backgroundColor: "white",
    marginHorizontal: wp(3),
    marginTop: hp(1),
    padding: wp(3),
    borderRadius: 12,
    elevation: 2,
  },
  totalsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  totalItem: {
    width: "48%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(3),
    marginBottom: hp(1),
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  netTotalItem: {
    backgroundColor: "#e8f5e9",
    borderColor: "#c8e6c9",
  },
  totalLabel: {
    fontSize: isSmallScreen ? 12 : 13,
    color: "#555",
    fontWeight: "500",
  },
  totalValue: {
    fontSize: isSmallScreen ? 13 : 14,
    color: "#333",
    fontWeight: "600",
  },
  netTotalLabel: {
    color: "#2E7D32",
    fontWeight: "600",
  },
  // netTotalValue: {
  //   color: "#2E7D32",
  //   fontWeight: "bold",
  //   fontSize: isSmallScreen ? 14 : 15,
  // },
  netTotalValue: {
    color: "#2E7D32",
    fontWeight: "bold",
    fontSize: isSmallScreen ? 14 : 15,
  },
  buttonContainer: {
    flexDirection: isSmallScreen ? "column" : "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    paddingBottom: hp(3),
  },
  saveButton: {
    backgroundColor: "#4caf50",
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(6),
    borderRadius: 20,
    marginHorizontal: isSmallScreen ? 0 : wp(1.5),
    marginBottom: isSmallScreen ? hp(1) : 0,
    minWidth: isSmallScreen ? "80%" : wp(25),
    alignItems: "center",
    elevation: 3,
  },
  showButton: {
    backgroundColor: "#2196f3",
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(6),
    borderRadius: 20,
    marginHorizontal: isSmallScreen ? 0 : wp(1.5),
    marginBottom: isSmallScreen ? hp(1) : 0,
    minWidth: isSmallScreen ? "80%" : wp(25),
    alignItems: "center",
    elevation: 3,
  },
  clearButton: {
    backgroundColor: "#ff9800",
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(6),
    borderRadius: 20,
    marginHorizontal: isSmallScreen ? 0 : wp(1.5),
    marginBottom: isSmallScreen ? hp(1) : 0,
    minWidth: isSmallScreen ? "80%" : wp(25),
    alignItems: "center",
    elevation: 3,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: isSmallScreen ? 13 : 14,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  tableHeader: {
    flexDirection: "row",
    // backgroundColor: "#c9a7a7", // header background like your image
    backgroundColor: "#2E7D32",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#999",
  },
  headerText: {
    flex: 1,
    fontWeight: "bold",
    textAlign: "center",
    color: "#fff",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  rowText: {
    flex: 1,
    textAlign: "center",
    color: "#333",
  },
});

export default FranchiseTransfer;