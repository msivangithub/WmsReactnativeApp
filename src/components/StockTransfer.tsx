import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  BackHandler,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  ToastAndroid,
  Keyboard,
} from 'react-native';
import axios from 'axios';
import { Dropdown } from 'react-native-element-dropdown';
import { useApi } from './APIcontext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import BarcodeScanner from './Barcodescan';


interface Stockscreenprop {
  onBack: () => void;
}

interface DropdownItem {
  label: string;
  value: string;
  BranchDefwhouse?: boolean;
  date?: string;
  Tobranch?: string;
  StateCode?: string;
  StateShortName?: string;
  statecode?: string;
  stateshortname?: string;
}

interface TableRow {
  packetNo: string;
  itemCode: string;
  hsnCode: string;
  oemCode: string;
  uomId: string;
  itemDescription: string;
  currentQty: string;
  transferQty: string;
  purchasePrice: string;
  mrp: string;
  discountPrice: string;
  inTax: string;
  inTaxType: string;
  supplier: string;
  Disc: string;
  discType: string;
  outTax: string;
  outTaxType: string;
  cgstPer: string;
  cgstAmt: string;
  sgstPer: string;
  sgstAmt: string;
  igstPer: string;
  igstAmt: string;
  utgstPer: string;
  utgstAmt: string;
  division: string;
  department: string;
  category: string;
  SubCategory: string;
  style: string;
  design: string;
  size: string;
  brand: string;
  Fabric: string;
  Tokens: string;
  color: string;
  verticle1: string;
  verticle2: string;
  verticle3: string;
  discRate: string;
  isHighlighted: boolean;
}

const StockTransfer: React.FC<Stockscreenprop> = ({ onBack }) => {
  const [Loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [source, setSource] = useState('');
  const [destinationBranch, setDestinationBranch] = useState('');
  const [sourceStateCode, setSourceStateCode] = useState<string>('');
  const [destinationStateCode, setDestinationStateCode] = useState<string>('');
  const [transNo, setTransNo] = useState('');
  const [itemcode, setItemcode] = useState('');
  const [packetNo, setPacketNo] = useState(1);
  const [totalitems, setTotalitems] = useState('0.00');
  const [totalqty, setTotalQty] = useState('0.00');
  const [totalexpqty, setTotalexpqty] = useState('0.00');
  const [ratevalue, setRatevalue] = useState('0.00');
  const [mrpvalue, setMrpvalue] = useState('0.00');
  const [isTransNoVisible, setIsTransNoVisible] = useState(false);
  const [tableData, setTableData] = useState<TableRow[]>([]);
  const [showQtyInput, setShowQtyInput] = useState(false);
  const [tempQty, setTempQty] = useState<string>('0');
  const [tempItemDetails, setTempItemDetails] = useState<any>(null);
  const [showScanner, setShowScanner] = useState(false);
  const { API_URL, counterId } = useApi();
  const qtyInputRef = useRef<TextInput>(null);
  const itemCodeInputRef = useRef<TextInput>(null);
  const [showSoftInput, setShowSoftInput] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const tableScrollRef = useRef<ScrollView>(null);

  // Dropdown data states
  const [sourceData, setSourceData] = useState<DropdownItem[]>([]);
  const [destinationData, setDestinationData] = useState<DropdownItem[]>([]);
  const [transNoData, setTransNoData] = useState<DropdownItem[]>([]);
  const [itemCodeData, setItemCodeData] = useState<DropdownItem[]>([]);
  const [lastIncrementedItemCode, setLastIncrementedItemCode] = useState<string>('');
  console.log('CounterIdStock', counterId);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    if (isKeyboardVisible && itemCodeInputRef.current && !showQtyInput) {
      itemCodeInputRef.current.focus();
    }
  }, [isKeyboardVisible, showQtyInput]);

  useEffect(() => {
    if (showSoftInput) {
      itemCodeInputRef.current?.focus();
    }
  }, [showSoftInput]);

  useEffect(() => {
    focusItemCodeInput();
  }, []);

  // const focusItemCodeInput = () => {
  //   setShowSoftInput(false);
  //   itemCodeInputRef.current?.focus();
  // };
  const focusItemCodeInput = () => {
  setShowSoftInput(false);
  setTimeout(() => {
    itemCodeInputRef.current?.focus();
  }, 100);
};

  // AsyncStorage key for caching
  const CACHE_KEY = 'StockTransferCache';

  // Save form data to AsyncStorage
  const saveFormDataToCache = async () => {
    try {
      const formData = {
        source,
        destinationBranch,
        sourceStateCode,
        destinationStateCode,
        transNo,
        itemcode,
        packetNo,
        totalitems,
        totalqty,
        totalexpqty,
        ratevalue,
        mrpvalue,
        isTransNoVisible,
        tableData,
        showQtyInput,
        tempQty,
        tempItemDetails,
        lastIncrementedItemCode,
      };
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(formData));
      console.log('Form data cached successfully');
    } catch (err) {
      console.error('Failed to save form data to cache:', err);
    }
  };

  // Load form data from AsyncStorage
  const loadFormDataFromCache = async () => {
    try {
      const cachedData = await AsyncStorage.getItem(CACHE_KEY);
      if (cachedData) {
        const formData = JSON.parse(cachedData);
        setSource(formData.source || '');
        setDestinationBranch(formData.destinationBranch || '');
        setSourceStateCode(formData.sourceStateCode || '');
        setDestinationStateCode(formData.destinationStateCode || '');
        setTransNo(formData.transNo || '');
        setItemcode(formData.itemcode || '');
        setPacketNo(formData.packetNo || 1);
        setTotalitems(formData.totalitems || '0.00');
        setTotalQty(formData.totalqty || '0.00');
        setTotalexpqty(formData.totalexpqty || '0.00');
        setRatevalue(formData.ratevalue || '0.00');
        setMrpvalue(formData.mrpvalue || '0.00');
        setIsTransNoVisible(formData.isTransNoVisible || false);
        setTableData(formData.tableData.map((row: TableRow) => ({ ...row, isHighlighted: row.isHighlighted ?? false })) || []);
        setShowQtyInput(formData.showQtyInput || false);
        setTempQty(formData.tempQty || '1');
        setTempItemDetails(formData.tempItemDetails || null);
        setLastIncrementedItemCode(formData.lastIncrementedItemCode || '');
        console.log('Form data restored from cache');
      }
    } catch (err) {
      console.error('Failed to load form data from cache:', err);
    }
  };

  // Clear cached data
  const clearFormDataCache = async () => {
    try {
      await AsyncStorage.removeItem(CACHE_KEY);
      console.log('Form data cache cleared');
    } catch (err) {
      console.error('Failed to clear form data cache:', err);
    }
  };

  const handleIncrementPacketNo = () => {
    if (itemcode.trim() && itemcode !== lastIncrementedItemCode) {
      setPacketNo((prev) => prev + 1);
      setLastIncrementedItemCode(itemcode); // Track the itemcode used for this increment
    }
  };

  const fetchSourceDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(
        `${API_URL}/api/StockExportToBranch/api/V1/GetSourceDetails`
      );
      const getdetails = response.data[0]?.[0] || [];
      const formattedgetdetails: DropdownItem[] = getdetails.map(
        (item: { 'Branch Id': any; 'Branch Name': any; 'Defwhouse': any, 'StateCode': any, 'StateShortName': any }) => ({
          label: item['Branch Name'],
          value: item['Branch Id'],
          BranchDefwhouse: item['Defwhouse'],
          StateCode: item['StateCode'],
          StateShortName: item['StateShortName'],
        })
      );
      setSourceData(formattedgetdetails);

      const defaultBranch = formattedgetdetails.find(
        (item: DropdownItem) => item.BranchDefwhouse === true
      );
      if (defaultBranch) {
        setSource(defaultBranch.value);
        setSourceStateCode(defaultBranch.StateCode || '');
      }
    } catch (err) {
      setError('Failed to fetch Source.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDestinationDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(
        `${API_URL}/api/StockExportToBranch/api/V1/GetDestinationDetails`
      );
      const getdetails = response.data[0]?.[0] || [];
      const formattedgetdetails: DropdownItem[] = getdetails.map(
        (item: { 'Branch Id': any; 'Branch Name': any, StateCode: any, StateShortName: any }) => ({
          label: item['Branch Name'],
          value: item['Branch Id'],
          statecode: item['StateCode'],
          stateshortname: item['StateShortName']
        })
      );
      setDestinationData(formattedgetdetails);
    } catch (err) {
      setError('Failed to fetch Destination.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransNoDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(
        `${API_URL}/api/StockExportToBranch/api/V1/GetTransNoDetails`
      );
      const getdetails = response.data[0]?.[0] || [];
      const formattedgetdetails: DropdownItem[] = getdetails.map(
        (item: { TranNo: any; TransDate: any; ToBranch: any }) => ({
          label: item['TranNo'],
          value: item['TranNo'],
          date: item['TransDate'],
          Tobranch: item['ToBranch'],
        })
      );
      setTransNoData(formattedgetdetails);
    } catch (err) {
      setError('Failed to fetch Trans No.');
    } finally {
      setLoading(false);
    }
  };

  const getBranchIdByName = (branchName: string): string => {
    const branch = destinationData.find(
      (item: DropdownItem) => item.label === branchName
    );
    return branch ? branch.value : '';
  };

  const fetchTransNoByIdDetails = async (transNo: string, destBranchId: string) => {
    if (!transNo || !destBranchId) {
      setError('Please select both Trans No and Destination Branch');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await axios.get(
        `${API_URL}/api/StockExportToBranch/api/V1/GetByIdTransNoDetails?TransNo=${transNo}&DestBranch=${destBranchId}`
      );

      const transDetails = response.data[0]?.[0] || [];
      if (transDetails.length === 0) {
        setError('No details found for the selected transaction');
        setTableData([]);
        setTotalitems('0.00');
        setTotalQty('0.00');
        setTotalexpqty('0.00');
        setRatevalue('0.00');
        setMrpvalue('0.00');
        return;
      }

      const newTableData: TableRow[] = transDetails.map((item: any) => {
        // Calculate Gross Amount
        const rate = parseFloat(item.PurchasePrice) || 0;
        const transferQty = parseFloat(item.Qty || '1') || 1;
        const grossAmt = (transferQty * rate).toFixed(4);

        // Calculate Item Total
        const itemDiscAmt = parseFloat(item.Discount || '0') || 0;
        const billDiscAmt = 0;
        const itemTotal = grossAmt;

        // GST Calculations
        let cgstAmt = '0.0000';
        let sgstAmt = '0.0000';
        let igstAmt = '0.0000';
        let utgstAmt = '0.0000';
        let cgstPer = parseFloat(item.CGST_Per) || 0;
        let sgstPer = parseFloat(item.SGST_Per) || 0;
        let igstPer = parseFloat(item.IGST_Per) || 0;
        let utgstPer = parseFloat(item.UTGST_Per) || 0;

        const gstType = item.InTaxtype;

        // if (sourceStateCode === destinationStateCode) {
        //   // Same State: Show CGST and SGST, hide IGST and UTGST
        //   igstPer = 0;
        //   utgstPer = 0;
        //   if (gstType === 'I') {
        //     // Inclusive GST
        //     const gstAmt = (parseFloat(itemTotal) - (parseFloat(itemTotal) * (100 / (100 + (cgstPer + sgstPer))))).toFixed(4);
        //     cgstAmt = ((parseFloat(gstAmt) * cgstPer) / (cgstPer + sgstPer) || 0).toFixed(4);
        //     sgstAmt = ((parseFloat(gstAmt) * sgstPer) / (cgstPer + sgstPer) || 0).toFixed(4);
        //   } else if (gstType === 'E') {
        //     // Exclusive GST
        //     cgstAmt = ((parseFloat(itemTotal) * cgstPer) / 100).toFixed(4);
        //     sgstAmt = ((parseFloat(itemTotal) * sgstPer) / 100).toFixed(4);
        //   }
        // } else {
        //   // Different State: Show IGST, hide CGST, SGST, and UTGST
        //   cgstPer = 0;
        //   sgstPer = 0;
        //   utgstPer = 0;
        //   if (gstType === 'I') {
        //     // Inclusive GST
        //     igstAmt = (parseFloat(itemTotal) - (parseFloat(itemTotal) * (100 / (100 + igstPer)))).toFixed(4);
        //   } else if (gstType === 'E') {
        //     // Exclusive GST
        //     igstAmt = ((parseFloat(itemTotal) * igstPer) / 100).toFixed(4);
        //   }
        // }
        if (sourceStateCode) {
          igstPer = 0;
          utgstPer = 0;
          if (gstType === 'I') {
            // Inclusive GST
            const gstAmt = (parseFloat(itemTotal) - (parseFloat(itemTotal) * (100 / (100 + (cgstPer + sgstPer))))).toFixed(4);
            cgstAmt = ((parseFloat(gstAmt) * cgstPer) / (cgstPer + sgstPer) || 0).toFixed(4);
            sgstAmt = ((parseFloat(gstAmt) * sgstPer) / (cgstPer + sgstPer) || 0).toFixed(4);
          } else if (gstType === 'E') {
            // Exclusive GST
            cgstAmt = ((parseFloat(itemTotal) * cgstPer) / 100).toFixed(4);
            sgstAmt = ((parseFloat(itemTotal) * sgstPer) / 100).toFixed(4);
          }
        } else {
          // Different State: Show IGST, hide CGST, SGST, and UTGST
          cgstPer = 0;
          sgstPer = 0;
          utgstPer = 0;
          if (gstType === 'I') {
            // Inclusive GST
            igstAmt = (parseFloat(itemTotal) - (parseFloat(itemTotal) * (100 / (100 + igstPer)))).toFixed(4);
          } else if (gstType === 'E') {
            // Exclusive GST
            igstAmt = ((parseFloat(itemTotal) * igstPer) / 100).toFixed(4);
          }
        }
        console.log(cgstAmt);

        return {
          packetNo: item.PacketNo,
          itemCode: item.Itemcode,
          hsnCode: item.HSNCode,
          oemCode: item.OEMCode,
          itemDescription: item.ItemDescription,
          currentQty: item.Qty?.toString(),
          transferQty: item.Qty?.toString(),
          purchasePrice: item.PurchasePrice?.toString(),
          mrp: item.MRP?.toString(),
          discountPrice: item.DiscountPrice?.toString(),
          discount: parseFloat(item.Disc) || 0,
          inTax: item.InTax?.toString(),
          inTaxType: item.InTaxtype,
          outTax: item.Tax?.toString(),
          outTaxType: item.Taxtype,
          cgstPer: cgstPer.toString(),
          cgstAmt: cgstAmt,
          sgstPer: sgstPer.toString(),
          sgstAmt: sgstAmt,
          igstPer: igstPer.toString(),
          igstAmt: igstAmt,
          utgstPer: utgstPer.toString(),
          utgstAmt: utgstAmt,
          division: item.Division,
          department: item.Department,
          category: item.Category,
          style: item.Style,
          design: item.Design,
          size: item.Size,
          brand: item.Brand,
          color: item.Color,
          verticle1: item.Verticle1,
          discRate: item.P_Distributor_rate?.toString(),
          isHighlighted: false
        };
      });
      console.log(newTableData);
      setTableData(newTableData);

      const totalItems = newTableData.length;
      const totalQty = newTableData
        .reduce((sum, row) => sum + parseFloat(row.transferQty || '0'), 0)
        .toFixed(2);
      const totalExpQty = totalQty;
      const rateValue = newTableData
        .reduce(
          (sum, row) =>
            sum + parseFloat(row.purchasePrice || '0') * parseFloat(row.transferQty || '0'),
          0
        )
        .toFixed(2);
      const mrpValue = newTableData
        .reduce(
          (sum, row) => {
            const discountPrice = parseFloat(row.discountPrice) || 0;
            const mrp = parseFloat(row.mrp) || 0;
            const priceToUse = discountPrice !== 0 ? discountPrice : mrp;
            return sum + priceToUse * parseFloat(row.transferQty || '0');
          },
          0
        )
        .toFixed(2);

      setTotalitems(totalItems.toString());
      setTotalQty(totalQty);
      setTotalexpqty(totalExpQty);
      setRatevalue(rateValue);
      setMrpvalue(mrpValue);
    } catch (err) {
      setError('No Records To Match Your Criteria');
      console.log('Error fetching transaction details:', err);
    } finally {
      setLoading(false);
    }
  };

  // const fetchItemDetails = async (itemcode: string) => {
  //   if (!itemcode || !destinationBranch) {
  //     setError('Please select both item code and destination branch');
  //     return;
  //   }

  //   setLoading(true);
  //   setError('');
  //   try {
  //     const response = await axios.get(
  //       `${API_URL}/api/StockExportToBranch/api/V1/GetItemCodeDetails?ItemCode=${itemcode}&Qty=${tempQty}&DestBranch=${destinationBranch}`
  //     );

  //     const itemDetails = response.data[0]?.[0]?.[0];
  //     console.log(itemDetails);
  //     if (itemDetails) {
  //       const currentQty = parseFloat(itemDetails.Qty?.toString() || '0');

  //       // Check if item already exists in tableData
  //       const existingItemIndex = tableData.findIndex((row) => row.itemCode === itemcode);

  //       if (existingItemIndex !== -1) {
  //         const existingItem = tableData[existingItemIndex];
  //         const existingCurrentQty = parseFloat(existingItem.currentQty || '0');
  //         const existingTransferQty = parseFloat(existingItem.transferQty || '0');

  //         // Check if there is remaining quantity
  //         const remainingQty = existingCurrentQty - existingTransferQty;
  //         if (remainingQty <= 0) {
  //           setError('No remaining quantity available for this item');
  //           setShowScanner(false);
  //           setLoading(false);
  //           return;
  //         }

  //         // Show quantity input to add to existing transferQty
  //         setShowQtyInput(true);
  //         setTempQty(remainingQty.toString());
  //         setTempItemDetails({ ...itemDetails, existingItemIndex });
  //         setTimeout(() => qtyInputRef.current?.focus(), 100);
  //         setLoading(false);
  //         return;
  //       }

  //       // If no existing item, proceed as before
  //       if (currentQty === 0) {
  //         console.log(currentQty);
  //         setShowScanner(false);
  //         setError('Item has zero quantity available');
  //       } else if (currentQty > 1 || currentQty < 1) {
  //         setShowQtyInput(true);
  //         setShowScanner(false);
  //         setTempQty(currentQty.toString());
  //         setTempItemDetails(itemDetails);
  //         setTimeout(() => qtyInputRef.current?.focus(), 100);
  //       } else {
  //         addItemToTable(itemDetails, currentQty.toString());
  //       }
  //     } else {
  //       setError('No item details found for the provided code');
  //     }
  //   } catch (err) {
  //     setError('Failed to fetch item details. Please try again.');
  //     console.error('Error fetching item details:', err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  // const fetchItemDetails = async (itemcode: string) => {
  //   if (!itemcode || !destinationBranch) {
  //     setError('Please select both item code and destination branch');
  //     return; // Scanner remains open
  //   }

  //   setLoading(true);
  //   setError('');
  //   try {
  //     const response = await axios.get(
  //       `${API_URL}/api/StockExportToBranch/api/V1/GetItemCodeDetails?ItemCode=${itemcode}&Qty=${tempQty}&DestBranch=${destinationBranch}`
  //     );

  //     const itemDetails = response.data[0]?.[0]?.[0];
  //     console.log(itemDetails);
  //     if (itemDetails) {
  //       const currentQty = parseFloat(itemDetails.Qty?.toString() || '0');

  //       // Check if item already exists in tableData
  //       const existingItemIndex = tableData.findIndex((row) => row.itemCode === itemcode);

  //       if (existingItemIndex !== -1) {
  //         const existingItem = tableData[existingItemIndex];
  //         const existingCurrentQty = parseFloat(existingItem.currentQty || '0');
  //         const existingTransferQty = parseFloat(existingItem.transferQty || '0');

  //         // Calculate remaining quantity
  //         const remainingQty = existingCurrentQty - existingTransferQty;
  //         if (remainingQty < 1) {
  //           setError('No remaining quantity available for this item');
  //           setItemcode('');
  //           setShowScanner(false); // Close scanner when remainingQty < 1
  //           setLoading(false);
  //           focusItemCodeInput();
  //           return;
  //         }

  //         // Show quantity input and close scanner
  //         setShowQtyInput(true);
  //         setShowScanner(false); // Close scanner for existing item with remainingQty >= 1
  //         setTempQty(remainingQty.toString());
  //         setTempItemDetails({ ...itemDetails, existingItemIndex });
  //         setTimeout(() => qtyInputRef.current?.focus(), 100);
  //         setLoading(false);
  //         return;
  //       }

  //       // Handle new item based on currentQty
  //       if (currentQty === 0) {
  //         setError('Item has zero quantity available');
  //         setLoading(false);
  //         setItemcode('');
  //         focusItemCodeInput();
  //         return; // Scanner remains open
  //       } else if (currentQty > 1 || currentQty < 1) {
  //         setShowQtyInput(true);
  //         setShowScanner(false); // Close scanner when qty input is needed
  //         setTempQty(currentQty.toString());
  //         setTempItemDetails(itemDetails);
  //         setTimeout(() => qtyInputRef.current?.focus(), 100);
  //       } else {
  //         addItemToTable(itemDetails, currentQty.toString());
  //         // Scanner remains open for currentQty === 1 to allow immediate rescanning
  //       }
  //     } else {
  //       setError('No item details found for the provided code');
  //       setLoading(false);
  //       setItemcode('');
  //       focusItemCodeInput();
  //       return; // Scanner remains open
  //     }
  //   } catch (err) {
  //     setError('Failed to fetch item details. Please try again.');
  //     setItemcode('');
  //     console.log('Error fetching item details:', err);
  //     setShowScanner(false);
  //     setLoading(false);
  //     focusItemCodeInput();
  //     return;
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const fetchItemDetails = async (itemcode: string) => {
  if (!itemcode || !destinationBranch) {
    setError('Please select both item code and destination branch');
    // Reset input states to initial values
    setItemcode('');
    setShowQtyInput(false);
    setTempQty('0');
    setTempItemDetails(null);
    focusItemCodeInput();
    return; // Scanner remains open
  }

  setLoading(true);
  setError('');
  try {
    const response = await axios.get(
      `${API_URL}/api/StockExportToBranch/api/V1/GetItemCodeDetails?ItemCode=${itemcode}&Qty=${tempQty}&DestBranch=${destinationBranch}`
    );

    const itemDetails = response.data[0]?.[0]?.[0];
    console.log(itemDetails);
    if (itemDetails) {
      const currentQty = parseFloat(itemDetails.Qty?.toString() || '0');

      // Check if item already exists in tableData
      const existingItemIndex = tableData.findIndex((row) => row.itemCode === itemcode);

      if (existingItemIndex !== -1) {
        const existingItem = tableData[existingItemIndex];
        const existingCurrentQty = parseFloat(existingItem.currentQty || '0');
        const existingTransferQty = parseFloat(existingItem.transferQty || '0');

        // Calculate remaining quantity
        const remainingQty = existingCurrentQty - existingTransferQty;
        if (remainingQty < 1) {
          setError('No remaining quantity available for this item');
          setItemcode('');
          setShowQtyInput(false);
          setTempQty('0');
          setTempItemDetails(null);
          setShowScanner(false); // Close scanner when remainingQty < 1
          setLoading(false);
          focusItemCodeInput();
          return;
        }

        // Show quantity input and close scanner
        setShowQtyInput(true);
        setShowScanner(false); // Close scanner for existing item with remainingQty >= 1
        setTempQty(remainingQty.toString());
        setTempItemDetails({ ...itemDetails, existingItemIndex });
        setTimeout(() => qtyInputRef.current?.focus(), 100);
        setLoading(false);
        return;
      }

      // Handle new item based on currentQty
      if (currentQty === 0) {
        setError('Item has zero quantity available');
        setLoading(false);
        setItemcode('');
        setShowQtyInput(false);
        setTempQty('0');
        setTempItemDetails(null);
        focusItemCodeInput();
        return; // Scanner remains open
      } else if (currentQty > 1 || currentQty < 1) {
        setShowQtyInput(true);
        setShowScanner(false); // Close scanner when qty input is needed
        setTempQty(currentQty.toString());
        setTempItemDetails(itemDetails);
        setTimeout(() => qtyInputRef.current?.focus(), 100);
      } else {
        addItemToTable(itemDetails, currentQty.toString());
        // Scanner remains open for currentQty === 1 to allow immediate rescanning
        setItemcode(''); // Clear itemcode after adding to table
        setShowQtyInput(false);
        setTempQty('0');
        setTempItemDetails(null);
        focusItemCodeInput();
      }
    } else {
      setError('No item details found for the provided code');
      setLoading(false);
      setItemcode('');
      setShowQtyInput(false);
      setTempQty('0');
      setTempItemDetails(null);
      focusItemCodeInput();
      return; // Scanner remains open
    }
  } catch (err) {
    setError('Failed to fetch item details. Please try again.');
    setItemcode('');
    setShowQtyInput(false);
    setTempQty('0');
    setTempItemDetails(null);
    setShowScanner(false);
    setLoading(false);
    focusItemCodeInput();
    return;
  } finally {
    setLoading(false);
  }
};
  const addItemToTable = (itemDetails: any, qty: string) => {
    // Calculate Gross Amount
    const rate = parseFloat(itemDetails.PurchasePrice) || 0;
    const transferQty = parseFloat(qty) || 1;
    const grossAmt = (transferQty * rate).toFixed(4);

    // Calculate Item Total
    const itemDiscAmt = parseFloat(itemDetails.Discount || '0') || 0;
    const billDiscAmt = 0;
    const itemTotal = grossAmt;

    // GST Calculations
    let cgstAmt = '0.0000';
    let sgstAmt = '0.0000';
    let igstAmt = '0.0000';
    let utgstAmt = '0.0000';
    let cgstPer = parseFloat(itemDetails.CGST_Per) || 0;
    let sgstPer = parseFloat(itemDetails.SGST_Per) || 0;
    let igstPer = parseFloat(itemDetails.IGST_Per) || 0;
    let utgstPer = parseFloat(itemDetails.UTGST_Per) || 0;

    const gstType = itemDetails.InTaxtype;

    if (sourceStateCode === destinationStateCode) {
      // Same State: Show CGST and SGST, hide IGST and UTGST
      igstPer = 0;
      utgstPer = 0;
      if (gstType === 'I') {
        // Inclusive GST
        const gstAmt = (parseFloat(itemTotal) - (parseFloat(itemTotal) * (100 / (100 + (cgstPer + sgstPer))))).toFixed(4);
        cgstAmt = ((parseFloat(gstAmt) * cgstPer) / (cgstPer + sgstPer) || 0).toFixed(4);
        sgstAmt = ((parseFloat(gstAmt) * sgstPer) / (cgstPer + sgstPer) || 0).toFixed(4);
      } else if (gstType === 'E') {
        // Exclusive GST
        cgstAmt = ((parseFloat(itemTotal) * cgstPer) / 100).toFixed(4);
        sgstAmt = ((parseFloat(itemTotal) * sgstPer) / 100).toFixed(4);
      }
    } else {
      // Different State: Show IGST, hide CGST, SGST, and UTGST
      cgstPer = 0;
      sgstPer = 0;
      utgstPer = 0;
      if (gstType === 'I') {
        // Inclusive GST
        igstAmt = (parseFloat(itemTotal) - (parseFloat(itemTotal) * (100 / (100 + igstPer)))).toFixed(4);
      } else if (gstType === 'E') {
        // Exclusive GST
        igstAmt = ((parseFloat(itemTotal) * igstPer) / 100).toFixed(4);
      }
    }

    const newRow: TableRow = {
      packetNo: itemDetails.PacketNo?.toString() || packetNo.toString(),
      itemCode: itemDetails.Itemcode,
      hsnCode: itemDetails.HSNCode,
      oemCode: itemDetails.OEMCode,
      itemDescription: itemDetails.ItemDescription,
      currentQty: itemDetails.Qty?.toString(),
      transferQty: qty,
      purchasePrice: itemDetails.PurchasePrice?.toString(),
      mrp: itemDetails.MRP?.toString(),
      discountPrice: itemDetails.DiscountPrice?.toString(),
      inTax: itemDetails.InTax?.toString(),
      inTaxType: itemDetails.InTaxtype,
      outTax: itemDetails.Tax?.toString(),
      outTaxType: itemDetails.Taxtype,
      cgstPer: cgstPer.toString(),
      cgstAmt: cgstAmt,
      sgstPer: sgstPer.toString(),
      sgstAmt: sgstAmt,
      igstPer: igstPer.toString(),
      igstAmt: igstAmt,
      utgstPer: utgstPer.toString(),
      utgstAmt: utgstAmt,
      division: itemDetails.Division,
      department: itemDetails.Department,
      category: itemDetails.Category,
      style: itemDetails.Style,
      supplier: itemDetails.Supplier,
      design: itemDetails.Design,
      size: itemDetails.Size,
      brand: itemDetails.Brand,
      color: itemDetails.Color,
      verticle1: itemDetails.Verticle1.toString(),
      discRate: itemDetails.P_Distributor_rate?.toString(),
      discType: itemDetails.DisType,
      uomId: itemDetails.UOMId,
      Disc: itemDetails.Discount,
      SubCategory: itemDetails.SubCategory,
      Fabric: itemDetails.SubCategory,
      Tokens: itemDetails.Tokens.toString(),
      verticle2: itemDetails.Verticle2.toString(),
      verticle3: itemDetails.Verticle3.toString(),
      isHighlighted: true
    };

    setTableData((prevData) => {
      const updated = prevData.map((row) => ({ ...row, isHighlighted: false }));
      updated.push(newRow);
      const lastIndex = updated.length - 1;
      setTimeout(() => {
        tableScrollRef.current?.scrollTo({ y: lastIndex * 40, animated: true });
      }, 100);
      return updated;
    });
    setItemcode('');
    setShowQtyInput(false);
    setTempQty('0');
    setTempItemDetails(null);
    setLastIncrementedItemCode('');

    setTotalitems((prev) => (parseInt(prev) + 1).toString());
    setTotalQty((prev) =>
      (parseFloat(prev) + parseFloat(newRow.currentQty || '1')).toFixed(2)
    );
    setTotalexpqty((prev) =>
      (parseFloat(prev) + parseFloat(newRow.transferQty || '1')).toFixed(2)
    );

    const purchasePrice = parseFloat(newRow.purchasePrice) || 0;
    const discountPrice = parseFloat(newRow.discountPrice) || 0;
    const mrp = parseFloat(newRow.mrp) || 0;
    const priceToUse = discountPrice !== 0 ? discountPrice : mrp;

    setRatevalue((prev) =>
      (parseFloat(prev) + purchasePrice * transferQty).toFixed(2)
    );
    setMrpvalue((prev) =>
      (parseFloat(prev) + priceToUse * transferQty).toFixed(2)
    );

    focusItemCodeInput();
  };

  console.log(`${API_URL}/api/StockExportToBranch/api/V1/GetItemCodeDetails?ItemCode=${itemcode}&Qty=${tempQty}&DestBranch=${destinationBranch}`);

  const handleQtySubmit = () => {
    if (!tempItemDetails || !tempQty) {
      setError('Quantity cannot be empty');
      return;
    }

    const qty = parseFloat(tempQty);
    const currentQty = parseFloat(tempItemDetails.Qty?.toString() || '0');

    if (isNaN(qty) || qty <= 0) {
      setError('Should not take zero or less than zero quantity');
      return;
    }

    // Check if this is an update to an existing item
    if (tempItemDetails.existingItemIndex !== undefined) {
      const existingItemIndex = tempItemDetails.existingItemIndex;
      const existingItem = tableData[existingItemIndex];
      const existingTransferQty = parseFloat(existingItem.transferQty || '0');
      const newTransferQty = existingTransferQty + qty;

      if (newTransferQty > currentQty) {
        setError('Total transfer quantity cannot exceed current quantity');
        return;
      }

      // Update the existing item's transferQty
      const updatedTableData = tableData.map((row, i) => ({
        ...row,
        isHighlighted: i === existingItemIndex ? true : false,
        transferQty: i === existingItemIndex ? newTransferQty.toString() : row.transferQty,
      }));

      setTableData(updatedTableData);

      // Update totals
      setTotalQty((prev) =>
        (parseFloat(prev) + qty).toFixed(2)
      );
      setTotalexpqty((prev) =>
        (parseFloat(prev) + qty).toFixed(2)
      );

      const purchasePrice = parseFloat(existingItem.purchasePrice) || 0;
      const discountPrice = parseFloat(existingItem.discountPrice) || 0;
      const mrp = parseFloat(existingItem.mrp) || 0;
      const priceToUse = discountPrice !== 0 ? discountPrice : mrp;

      setRatevalue((prev) =>
        (parseFloat(prev) + purchasePrice * qty).toFixed(2)
      );
      setMrpvalue((prev) =>
        (parseFloat(prev) + priceToUse * qty).toFixed(2)
      );

      // Scroll to the updated row
      setTimeout(() => {
        tableScrollRef.current?.scrollTo({ y: existingItemIndex * 40, animated: true });
      }, 100);

      // Reset input fields
      setShowQtyInput(false);
      setTempQty('0');
      setTempItemDetails(null);
      setItemcode('');
      focusItemCodeInput();
      return;
    }

    // For new items
    if (qty > currentQty) {
      setError('Transfer quantity cannot exceed current quantity');
      return;
    }

    addItemToTable(tempItemDetails, qty.toString());
  };

  const handleBarcodeScan = (code: string) => {
    setItemcode(code);
    // setShowScanner(false);
    fetchItemDetails(code);
  };

  useEffect(() => {
    // Load cached data and fetch initial data
    const initialize = async () => {
      await loadFormDataFromCache(); // Load cached data first
      await Promise.all([
        fetchSourceDetails(),
        fetchDestinationDetails(),
        fetchTransNoDetails(),
      ]);
    };
    initialize();
  }, []);

  useEffect(() => {
    const backAction = () => {
      // Only save form data to cache if transNo is empty and there is relevant data
      if (
        !transNo &&
        (tableData.length > 0 ||
          source ||
          destinationBranch ||
          itemcode ||
          totalitems !== '0.00' ||
          totalqty !== '0.00' ||
          totalexpqty !== '0.00' ||
          ratevalue !== '0.00' ||
          mrpvalue !== '0.00')
      ) {
        console.log('Saving form data to cache before back navigation...');
        saveFormDataToCache()
          .then(() => {
            console.log('Cache saved successfully before navigating back');
          })
          .catch((err) => {
            console.error('Error saving cache before back navigation:', err);
          });
      } else {
        console.log('Skipping cache save because transNo is filled or no relevant data');
      }
      onBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [
    onBack,
    source,
    destinationBranch,
    sourceStateCode,
    destinationStateCode,
    transNo,
    itemcode,
    packetNo,
    totalitems,
    totalqty,
    totalexpqty,
    ratevalue,
    mrpvalue,
    isTransNoVisible,
    tableData,
    showQtyInput,
    tempQty,
    tempItemDetails,
  ]);

  const handleDeleteRow = (index: number) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'OK',
          onPress: () => {
            const rowToDelete = tableData[index];
            const newTableData = tableData.filter((_, i) => i !== index);
            setTableData(newTableData);

            // Update summary values
            const totalItems = newTableData.length;
            const totalQty = newTableData
              .reduce((sum, row) => sum + parseFloat(row.currentQty || '0'), 0)
              .toFixed(2);
            const totalExpQty = newTableData
              .reduce((sum, row) => sum + parseFloat(row.transferQty || '0'), 0)
              .toFixed(2);
            const rateValue = newTableData
              .reduce(
                (sum, row) =>
                  sum +
                  parseFloat(row.purchasePrice || '0') * parseFloat(row.transferQty || '0'),
                0
              )
              .toFixed(2);
            const mrpValue = newTableData
              .reduce(
                (sum, row) => {
                  const discountPrice = parseFloat(row.discountPrice) || 0;
                  const mrp = parseFloat(row.mrp) || 0;
                  const priceToUse = discountPrice !== 0 ? discountPrice : mrp;
                  return sum + priceToUse * parseFloat(row.transferQty || '0');
                },
                0
              )
              .toFixed(2);

            setTotalitems(totalItems.toString());
            setTotalQty(totalQty);
            setTotalexpqty(totalExpQty);
            setRatevalue(rateValue);
            setMrpvalue(mrpValue);

            ToastAndroid.show('Item deleted successfully', ToastAndroid.SHORT);
            focusItemCodeInput();
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleShow = () => {
    setIsTransNoVisible(!isTransNoVisible);
    if (!isTransNoVisible) {
      setTransNo('');
      setTableData([]);
      setTotalitems('0.00');
      setTotalQty('0.00');
      setTotalexpqty('0.00');
      setRatevalue('0.00');
      setMrpvalue('0.00');
      setDestinationBranch('');
      setDestinationStateCode('');
    }
  };

  const handleClear = () => {
    Alert.alert(
      'Confirm Clear',
      'Do you want to clear the form?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: async () => {
            setLoading(true);
            setError('');
            try {
              setSource('');
              setDestinationBranch('');
              setSourceStateCode('');
              setDestinationStateCode('');
              setTransNo('');
              setItemcode('');
              setPacketNo(1);
              setTotalitems('0.00');
              setTotalQty('0.00');
              setTotalexpqty('0.00');
              setRatevalue('0.00');
              setMrpvalue('0.00');
              setIsTransNoVisible(false);
              setTableData([]);
              setShowQtyInput(false);
              setTempQty('0');
              setTempItemDetails(null);
              setDestinationData([]);
              setTransNoData([]);
              setItemCodeData([]);
              setLastIncrementedItemCode('');

              // Clear cached data
              await clearFormDataCache();

              // Reload source details
              await fetchSourceDetails();
              await fetchDestinationDetails();
              await fetchTransNoDetails();
            } catch (err) {
              setError('Failed to clear and reload source data.');
              console.error('Error in handleClear:', err);
            } finally {
              setLoading(false);
              focusItemCodeInput();
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  console.log('counterId', counterId);

  const handleSave = () => {
    if (!source || !destinationBranch || tableData.length === 0) {
      setError('Please fill all required fields and add at least one item');
      return;
    }

    Alert.alert(
      'Confirm Save',
      'Do you want to save the record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'OK',
          onPress: async () => {
            setLoading(true);
            setError('');

            try {
              const payload = {
                sourceBranch: source,
                destBranch: destinationBranch,
                toBranch_VM: destinationBranch,
                gstItems: tableData.map((item: TableRow) => ({
                  itemcode: item.itemCode,
                  hsnCode: item.hsnCode,
                  oemCode: item.oemCode,
                  itemDescription: item.itemDescription,
                  uomId: item.uomId,
                  qty: parseFloat(item.transferQty) || 0,
                  purchasePrice: parseFloat(item.purchasePrice) || 0,
                  mrp: parseFloat(item.mrp) || 0,
                  discount: parseFloat(item.Disc) || 0,
                  disType: item.discType,
                  discountPrice: parseFloat(item.discountPrice) || 0,
                  division: item.division,
                  department: item.department,
                  category: item.category,
                  subCategory: item.SubCategory,
                  style: item.style,
                  design: item.design,
                  size: item.size,
                  color: item.color,
                  brand: item.brand,
                  fabric: item.Fabric,
                  artName: item.category,
                  tranNo: transNo || '',
                  tokens: String(item.Tokens),
                  tax: parseFloat(item.outTax) || 0,
                  taxtype: item.outTaxType,
                  packetNo: item.packetNo,
                  counterId: counterId,
                  inTax: parseFloat(item.inTax) || 0,
                  inTaxtype: item.inTaxType,
                  supplier: item.supplier,
                  verticle1: item.verticle1,
                  verticle2: item.verticle2,
                  verticle3: item.verticle3,
                  pDistr_Rate: item.discRate,
                  cgsT_Per: parseFloat(item.cgstPer) || 0,
                  cgsT_Amt: parseFloat(item.cgstAmt) || 0,
                  sgsT_Per: parseFloat(item.sgstPer) || 0,
                  sgsT_Amt: parseFloat(item.sgstAmt) || 0,
                  igsT_Per: parseFloat(item.igstPer) || 0,
                  igsT_Amt: parseFloat(item.igstAmt) || 0,
                  utgsT_Per: parseFloat(item.utgstPer) || 0,
                  utgsT_Amt: parseFloat(item.utgstAmt) || 0,
                })),
              };
              console.log('Payload:', JSON.stringify(payload, null, 2));
              const response = await axios.post(
                `${API_URL}/api/StockExportToBranch/api/V1/Save`,
                payload
              );
              await fetchTransNoDetails();
              if (response.status === 201) {
                const textResponse = response.data;
                ToastAndroid.show(textResponse, ToastAndroid.SHORT);
                console.log(response.data);
                // Clear cached data on successful save
                await clearFormDataCache();
                setTableData([]);
                setItemcode('');
                setPacketNo(1);
                setTotalitems('0.00');
                setTotalQty('0.00');
                setTotalexpqty('0.00');
                setRatevalue('0.00');
                setMrpvalue('0.00');
                setTransNo('');
                setError('');
                focusItemCodeInput();
              }
            } catch (err) {
              setError('Failed to save stock transfer. Please try again.');
              console.error('Error saving stock transfer:', err);
            } finally {
              setLoading(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.mainContainer}>
      {Loading && (
        <View style={styles.spinnerContainer}>
          <ActivityIndicator size="large" color="#007BFF" />
          <Text style={styles.spinnerText}></Text>
        </View>
      )}
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Stock Transfer</Text>
        </View>

        <View style={styles.inputContainer}>
          {isTransNoVisible && (
            // <View style={styles.fullWidth}>
            <View style={[styles.fullWidth, { flexDirection: 'row', alignItems: 'center' }]}>
              <Text style={styles.labelText}>Trans No :</Text>
              <Dropdown
                // style={styles.dropdown}
                style={[styles.dropdown, { backgroundColor: '#fff' }]}
                selectedTextStyle={{ color: '#000' }}
                itemTextStyle={{ color: '#000' }}
                data={transNoData}
                search
                searchPlaceholder="Search Here..."
                labelField="label"
                valueField="value"
                placeholder="Select Trans No"
                placeholderStyle={{ color: 'gray' }}
                value={transNo}
                onChange={(item: DropdownItem) => {
                  setTransNo(item.value);
                  setTableData([]);
                  setTotalitems('0.00');
                  setTotalQty('0.00');
                  setTotalexpqty('0.00');
                  setRatevalue('0.00');
                  setMrpvalue('0.00');
                  const branchId = getBranchIdByName(item.Tobranch || '');
                  if (branchId) {
                    setDestinationBranch(branchId);
                    // Set destinationStateCode based on selected branch
                    const selectedBranch = destinationData.find(
                      (branch) => branch.value === branchId
                    );
                    setDestinationStateCode(selectedBranch?.statecode || '');
                    fetchTransNoByIdDetails(item.value, branchId);
                  } else {
                    setError('Destination branch not found for the selected transaction');
                    setTableData([]);
                    setTotalitems('0.00');
                    setTotalQty('0.00');
                    setTotalexpqty('0.00');
                    setRatevalue('0.00');
                    setMrpvalue('0.00');
                  }
                }}
              />
            </View>
          )}
          <View style={[styles.fullWidth, { flexDirection: 'row', alignItems: 'center' }]}>
            <Text style={styles.labelText}>Source :</Text>
            <Dropdown
              //  style={styles.dropdown}
              style={[styles.dropdown, { backgroundColor: '#fff' }]}
              selectedTextStyle={{ color: '#000' }}
              itemTextStyle={{ color: '#000' }}
              data={sourceData}
              search
              searchPlaceholder="Search Here..."
              labelField="label"
              valueField="value"
              placeholder="Select Source"
              placeholderStyle={{ color: 'gray' }}
              value={source}
              onChange={(item: DropdownItem) => {
                setSource(item.value);
                setSourceStateCode(item.StateCode || '');
              }}
            />
          </View>

          <View style={[styles.fullWidth, { flexDirection: 'row', alignItems: 'center' }]}>
            <Text style={styles.labelText}>Destination :</Text>
            <Dropdown
              // style={styles.dropdown}
              style={[styles.dropdown, { backgroundColor: '#fff' }]}
              selectedTextStyle={{ color: '#000' }}
              itemTextStyle={{ color: '#000' }}
              data={destinationData}
              search
              searchPlaceholder="Search Here..."
              labelField="label"
              valueField="value"
              placeholder="Select Destination"
              placeholderStyle={{ color: 'gray' }}
              value={destinationBranch}
              onChange={(item: DropdownItem) => {
                setDestinationBranch(item.value);
                setDestinationStateCode(item.statecode || '');
              }}
            />
          </View>
          <View style={[styles.fullWidth, { flexDirection: 'row', alignItems: 'center' }]}>
            <Text style={styles.labelText}>Packet No :</Text>
            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: itemcode.trim() ? '#4CAF50' : '#CCCCCC',
                  marginLeft: 10, // spacing between label and button
                },
              ]}
              onPress={handleIncrementPacketNo}
              disabled={!itemcode.trim()}
            >
              <Text style={styles.buttonText}>{packetNo}</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.fullWidth, styles.itemCodeContainer]}>
            {/* <Text style={styles.labelText}>ITEM/OEM Code :</Text> */}
            <Text
              numberOfLines={1}
              style={{ fontSize: 14, marginRight: 10, flexShrink: 1, width: 120, color: '#000', fontWeight: '500', }}
            >
              Item/OEM Code :</Text>

            <View style={styles.itemCodeInputWrapper}>
              {/* <TextInput
                ref={itemCodeInputRef}
                style={[styles.input, styles.inputWithIconText]}
                value={itemcode}
                onChangeText={(text) => {
                  const cleanedText = text.replace(/[\n\r]/g, '').trim();
                  setItemcode(cleanedText);
                }}
                onSubmitEditing={() => fetchItemDetails(itemcode)}
                onKeyPress={(event) => {
                  const key = event.nativeEvent.key;
                  console.log('Key pressed:', key);
                  if (key === 'ContextMenu' || key === 'Menu' || key === 'Unidentified') {
                    event.preventDefault();
                  }
                }}
                placeholder="Select Itemcode"
                placeholderTextColor={'gray'}
                keyboardType="default"
                returnKeyType="done"
                blurOnSubmit={false}
                contextMenuHidden={true}
                selectTextOnFocus={false}
                showSoftInputOnFocus={showSoftInput}
                onTouchStart={() => {
                  if (!showSoftInput) {
                    setShowSoftInput(true);
                  }
                }}
              /> */}
              <TextInput
  ref={itemCodeInputRef}
  style={[styles.input, styles.inputWithIconText]}
  value={itemcode}
  onChangeText={(text) => {
    const cleanedText = text.replace(/[\n\r]/g, '').trim();
    setItemcode(cleanedText);
    if (!cleanedText) {
      // Reset related states when itemcode is cleared
      setShowQtyInput(false);
      setTempQty('0');
      setTempItemDetails(null);
      setError('');
      focusItemCodeInput();
    }
  }}
  onSubmitEditing={() => fetchItemDetails(itemcode)}
  onKeyPress={(event) => {
    const key = event.nativeEvent.key;
    console.log('Key pressed:', key);
    if (key === 'ContextMenu' || key === 'Menu' || key === 'Unidentified') {
      event.preventDefault();
    }
  }}
  placeholder="Select Itemcode"
  placeholderTextColor={'gray'}
  keyboardType="default"
  returnKeyType="done"
  blurOnSubmit={false}
  contextMenuHidden={true}
  selectTextOnFocus={false}
  showSoftInputOnFocus={showSoftInput}
  onTouchStart={() => {
    if (!showSoftInput) {
      setShowSoftInput(true);
    }
  }}
/>
              {showQtyInput && (
                <TextInput
                  ref={qtyInputRef}
                  style={[styles.input, styles.qtyInput]}
                  value={tempQty}
                  onChangeText={setTempQty}
                  onSubmitEditing={handleQtySubmit}
                  placeholder="Enter Qty"
                  keyboardType="numeric"
                  autoFocus={true}
                  textAlign="center"
                />
              )}
              <TouchableOpacity
                style={styles.scanButton}
                onPress={() => setShowScanner(true)}
              >
                <Icon name="qr-code-scanner" size={24} color="#fff" />
              </TouchableOpacity>
              {showScanner && (
                <Modal
                  visible={showScanner}
                  transparent={true}
                  animationType="slide"
                  onRequestClose={() => setShowScanner(false)}
                >
                  <View style={{ flex: 1, width: '50%', height: '50%', alignItems: "center", justifyContent: "center", left: "25%" }}>
                    <BarcodeScanner
                      visible={showScanner}
                      onScan={handleBarcodeScan}
                      onClose={() => setShowScanner(false)}
                    />
                  </View>
                </Modal>
              )}
            </View>
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        <View style={styles.tableContainer}>
          <ScrollView horizontal>
            <View>
              <View style={styles.tableHeader}>
                <Text style={{ color: '#FFFFFF', fontWeight: 'bold', width: 60, textAlign: 'center', padding: 5, }}>
                  Pkt</Text>
                <Text style={styles.tableHeaderText}>Item Code</Text>
                <Text style={styles.tableHeaderText}>Exp Qty</Text>
                <Text style={styles.tableHeaderText}>Item Description</Text>
                <Text style={styles.tableHeaderText}>HSN_SAC Code</Text>
                <Text style={styles.tableHeaderText}>OEM Code</Text>
                {!transNo && <Text style={styles.tableHeaderText}>Current Qty</Text>}
                <Text style={styles.tableHeaderText}>Pur. price</Text>
                <Text style={styles.tableHeaderText}>MRP</Text>
                <Text style={styles.tableHeaderText}>Disc. price</Text>
                <Text style={styles.tableHeaderText}>InTax(%)</Text>
                <Text style={styles.tableHeaderText}>InTax Type</Text>
                <Text style={styles.tableHeaderText}>OutTax(%)</Text>
                <Text style={styles.tableHeaderText}>OutTax Type</Text>
                {sourceStateCode === destinationStateCode && (
                  <>
                    <Text style={styles.tableHeaderText}>CGST(%)</Text>
                    <Text style={styles.tableHeaderText}>CGST AMT</Text>
                    <Text style={styles.tableHeaderText}>SGST(%)</Text>
                    <Text style={styles.tableHeaderText}>SGST AMT</Text>
                  </>
                )}
                {sourceStateCode !== destinationStateCode && (
                  <>
                    <Text style={styles.tableHeaderText}>IGST(%)</Text>
                    <Text style={styles.tableHeaderText}>IGST AMT</Text>
                  </>
                )}
                <Text style={styles.tableHeaderText}>Division</Text>
                <Text style={styles.tableHeaderText}>Department</Text>
                <Text style={styles.tableHeaderText}>Category</Text>
                <Text style={styles.tableHeaderText}>Style</Text>
                <Text style={styles.tableHeaderText}>Design</Text>
                <Text style={styles.tableHeaderText}>Size</Text>
                <Text style={styles.tableHeaderText}>Brand</Text>
                <Text style={styles.tableHeaderText}>Color</Text>
                <Text style={styles.tableHeaderText}>verticle1</Text>
                <Text style={styles.tableHeaderText}>Disc_Rate</Text>
                {/* {!transNo && <Text style={styles.tableHeaderText}>Action</Text>} */}
              </View>
              <ScrollView ref={tableScrollRef} style={styles.tableBodyScroll} nestedScrollEnabled={true}>
                {tableData.map((row: TableRow, index: number) => (
                  <View key={index} style={[styles.tableRow, row.isHighlighted && styles.highlightedRow]}>
                    <View style={{ padding: 8, flexDirection: 'row', alignItems: 'center', width: 60, paddingTop: 3, }}>
                      {!transNo && (
                        <TouchableOpacity
                          style={styles.deleterowButton}
                          onPress={() => handleDeleteRow(index)}
                        >
                          <Icon name="delete" size={20} color="#fff" />
                        </TouchableOpacity>
                      )}
                      <Text style={styles.packetNoText}>{row.packetNo}</Text>
                    </View>
                    <Text style={styles.tableCell}>{row.itemCode}</Text>
                    <Text style={styles.tableCell}>{row.transferQty}</Text>
                    <Text style={styles.tableCell}>{row.itemDescription}</Text>
                    <Text style={styles.tableCell}>{row.hsnCode}</Text>
                    <Text style={styles.tableCell}>{row.oemCode}</Text>
                    {!transNo && <Text style={styles.tableCell}>{row.currentQty}</Text>}
                    <Text style={styles.tableCell}>
                      {parseFloat(row.purchasePrice).toFixed(2)}
                    </Text>
                    <Text style={styles.tableCell}>
                      {parseFloat(row.mrp).toFixed(2)}
                    </Text>
                    <Text style={styles.tableCell}>
                      {parseFloat(row.discountPrice).toFixed(2)}
                    </Text>
                    <Text style={styles.tableCell}>{row.inTax}</Text>
                    <Text style={styles.tableCell}>{row.inTaxType}</Text>
                    <Text style={styles.tableCell}>{row.outTax}</Text>
                    <Text style={styles.tableCell}>{row.outTaxType}</Text>
                    {sourceStateCode === destinationStateCode && (
                      <>
                        <Text style={styles.tableCell}>{row.cgstPer}</Text>
                        <Text style={styles.tableCell}>{row.cgstAmt}</Text>
                        <Text style={styles.tableCell}>{row.sgstPer}</Text>
                        <Text style={styles.tableCell}>{row.sgstAmt}</Text>
                      </>
                    )}
                    {sourceStateCode !== destinationStateCode && (
                      <>
                        <Text style={styles.tableCell}>{row.igstPer}</Text>
                        <Text style={styles.tableCell}>{row.igstAmt}</Text>
                      </>
                    )}
                    <Text style={styles.tableCell}>{row.division}</Text>
                    <Text style={styles.tableCell}>{row.department}</Text>
                    <Text style={styles.tableCell}>{row.category}</Text>
                    <Text style={styles.tableCell}>{row.style}</Text>
                    <Text style={styles.tableCell}>{row.design}</Text>
                    <Text style={styles.tableCell}>{row.size}</Text>
                    <Text style={styles.tableCell}>{row.brand}</Text>
                    <Text style={styles.tableCell}>{row.color}</Text>
                    <Text style={styles.tableCell}>{row.verticle1}</Text>
                    <Text style={styles.tableCell}>
                      {parseFloat(row.discRate).toFixed(2)}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryText}>Total Items</Text>
          <Text style={styles.summaryValue}>{totalitems}</Text>
        </View>
        {/* <View style={styles.summaryItem}>
            <Text style={styles.summaryText}>Total Qty</Text>
            <Text style={styles.summaryValue}>{totalqty}</Text>
          </View> */}
        <View style={styles.summaryItem}>
          <Text style={styles.summaryText}>Total Exp Qty</Text>
          <Text style={styles.summaryValue}>{totalexpqty}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryText}>Rate Value</Text>
          <Text style={styles.summaryValue}>{ratevalue}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryText}>MRP Value</Text>
          <Text style={styles.summaryValue}>{mrpvalue}</Text>
        </View>
      </View>
      {/* <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryText}>Rate Value</Text>
            <Text style={styles.summaryValue}>{ratevalue}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryText}>MRP Value</Text>
            <Text style={styles.summaryValue}>{mrpvalue}</Text>
          </View>
        </View> */}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            Loading || transNo
              ? { opacity: 0.6, backgroundColor: '#CCCCCC' }
              : { backgroundColor: '#4CAF50' },
          ]}
          onPress={handleSave}
          disabled={Loading || !!transNo}
        >
          <Text style={styles.buttonText}>{Loading ? 'SAVING...' : 'SAVE'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleShow}>
          <Text style={styles.buttonText}>{isTransNoVisible ? 'HIDE' : 'SHOW'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleClear}>
          <Text style={styles.buttonText}>CLEAR</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    paddingTop: 10,
    paddingBottom: 10,
  },
  header: {
    alignItems: 'center',
    marginVertical: 15,
    width: '100%',
    // backgroundColor: '#3949AB',
    backgroundColor: '#4CAF50',
    padding: 10,
    // alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'white',
    // textDecorationLine: 'underline',

  },
  labelText: {
    // fontWeight: 'bold',
    // marginBottom: 3,
    // fontSize: 16,
    fontSize: 14,
    marginRight: 10, // space between label and dropdown
    width: 80,
    color: '#333'
  },
  inputContainer: {
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 4,
    padding: 8,
    marginTop: 5,
    marginBottom: 10,
    color: '#333',
  },
  inputWithIconText: {
    flex: 1,
    marginRight: 10,
  },
  dropdown: {
    // borderWidth: 1,
    // borderColor: '#CCCCCC',
    // borderRadius: 4,
    // padding: 8,
    // marginTop: 5,
    // marginBottom: 10,
    // height: 40,
    flex: 1,          // takes up the rest of the space
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 8,
    color: '#333',
  },
  fullWidth: {
    width: '100%',
    marginBottom: 10,
  },
  itemCodeContainer: {
    flexDirection: 'column',
  },
  itemCodeInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyInput: {
    width: 100,
    marginLeft: 10,
    textAlign: 'center',
  },
  scanButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginRight: 10,
  },
  scanButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginBottom: 10,
  },
  tableContainer: {
    marginHorizontal: 10,
    marginTop: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0055A4',
    padding: 10,
  },
  tableHeaderText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    width: 120,
    textAlign: 'center',
    padding: 5,
  },
  tableBodyScroll: {
    maxHeight: 300,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC',
    padding: 3,
    paddingTop: 3,
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
  },
  highlightedRow: {
    // backgroundColor: 'yellow',
    backgroundColor: 'rgba(255, 250, 205, 1)',
  },
  tableCell: {
    width: 120,
    textAlign: 'center',
    paddingTop: 3,
    color: '#000'
  },
  packetNoText: {
    fontSize: 16,
    color:'#333'
    // paddingLeft:20,
  },
  deleterowButton: {
    marginRight: 8,
    backgroundColor: 'red',
    // padding: 4,
    borderRadius: 4,
  },
  deleteButton: {
    backgroundColor: '#FF0000',
    padding: 5,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 30,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: 'center',
    width: '30%',
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#0055A4',
    padding: 10,
    marginHorizontal: 10,
    marginBottom: 20,
    borderRadius: 4,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  summaryValue: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 5,
  },
  spinnerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    zIndex: 999,
  },
  spinnerText: {
    marginTop: 10,
    fontSize: 16,
    color: "#007BFF",
    fontWeight: "bold",
  },
});

export default StockTransfer; 