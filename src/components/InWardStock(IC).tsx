import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Modal,
  FlatList,
  BackHandler,
  ToastAndroid,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { Dropdown } from 'react-native-element-dropdown';
import { useApi } from './APIcontext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import BarcodeScanner from './Barcodescan';

interface InwardStockProps {
  onBack: () => void;
}

interface btNoData {
  label: string;
  value: string;
}

interface BranchData {
  label: string;
  value: string;
}

interface TableData {
  LTNo: string;
  TransDate: string;
  TransNo: string;
  PacketNo: string;
  Itemcode: string;
  HSNCode: string;
  OEMCode: string;
  ItemDesc: string;
  UOMId: string;
  Qty: string;
  ScanQty: string;
  PurchasePrice: string;
  P_Distributor_rate: string;
  MRP: string;
  DiscountPrice: string;
  Discount: string;
  DisType: string;
  Division: string;
  Department: string;
  Category: string;
  SubCategory: string;
  Style: string;
  Design: string;
  Size: string;
  Color: string;
  Brand: string;
  ArtName: string;
  OutTaxID: string;
  OutTax: string;
  OutTaxType: string;
  InTaxID: string;
  Intax: string;
  InTaxType: string;
  Suppliername: string;
  Verticle1: string;
  Verticle2: string;
  Verticle3: string;
  TokenType: string;
  Tokens: string;
  Fabric: string;
  Divuid: string;
  SDMUid: string;
  CatId: string;
  SCMUid: string;
  Styleid: string;
  DesId: string;
  SizeId: string;
  ColorId: string;
  BrandId: string;
  SupplierId: string;
  Art_Code: string;
  P_Disc: string;
  P_Disctype: string;
  TcsType: string;
  TcsAmt: string;
  RoundOff: string;
}

const purAcData = [
  { label: 'PURCHASES', value: 'PURCHASES' },
];

const InwardStockIC: React.FC<InwardStockProps> = ({ onBack }) => {
  const [Loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [purAc, setPurAc] = useState<string>('');
  const [purAcOptions, setPurAcOptions] = useState<btNoData[]>([]);
  const [ltNo, setLtNo] = useState<string>('<<select>>');
  const [btNo, setBtNo] = useState<string>('<<Select>>');
  const [ltNoOptions, setLtNoOptions] = useState<btNoData[]>([{ label: '<<select>>', value: '<<select>>' }]);
  const [btNoOptions, setBtNoOptions] = useState<btNoData[]>([{ label: '<<Select>>', value: '<<Select>>' }]);
  const [dcNoOptions, setDcNoOptions] = useState<btNoData[]>([]);
  const [supplierOptions, setSupplierOptions] = useState<btNoData[]>([]);
  const [scanInput, setScanInput] = useState<string>('');
  const [source, setSource] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [branchOptions, setBranchOptions] = useState<BranchData[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [rowCount, setRowCount] = useState<number>(0);
  const [totalQty, setTotalQty] = useState<number>(0.00);
  const [totalScanQty, setTotalScanQty] = useState<number>(0.00);
  const [tax, setTax] = useState<number>(0);
  const [tcs, setTcs] = useState<number>(0);
  const [ro, setRo] = useState<number>(0);
  const [totalValue, setTotalValue] = useState<number>(0.00);
  const { API_URL, counterId } = useApi();
  const [tableData, setTableData] = useState<TableData[]>([]);

  useEffect(() => {
    const backAction = () => {
      onBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [onBack]);

  const showToast = (message: string) => {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  };

  const fetchBranchDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(
        `${API_URL}/api/StockImportFromWareHouse/api/V1/GetBranchDetails`
      );
      const branches: { Unit: string; Name: string; Defwhouse: boolean; Branchid: string; Id: string }[] =
        response.data[0][0];

      const formattedBranches = branches.map(branch => ({
        label: `${branch.Name} (${branch.Unit})`,
        value: branch.Id,
      }));

      formattedBranches.sort((a: { label: string }, b: { label: any }) => a.label.localeCompare(b.label));
      setBranchOptions(formattedBranches);

      const warehouseBranch = branches.find(branch => branch.Unit === 'Warehouse');
      if (warehouseBranch && !source) {
        setSource(warehouseBranch.Id);
      }

      let defWarehouseBranch = branches.find(branch => branch.Defwhouse === true);
      if (
        warehouseBranch &&
        defWarehouseBranch &&
        warehouseBranch.Id === defWarehouseBranch.Id
      ) {
        defWarehouseBranch = branches.find(
          branch => branch.Defwhouse === true && branch.Id !== warehouseBranch.Id
        ) || branches.find(branch => branch.Id !== warehouseBranch.Id);
      }

      if (defWarehouseBranch && !destination) {
        setDestination(defWarehouseBranch.Id);
      }
    } catch (err) {
      setError('Failed to fetch branch details.');
      showToast('Failed to fetch branch details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(
        `${API_URL}/api/StockImportFromWareHouse/api/V1/GetDetails`,
        {
          params: {
            DestBranch: destination,
            Flag: 73,
          },
        }
      );

      const data: { TransNo?: string; DcNo?: string; RefNo?: string; GLId?: string; GLName?: string; Vend_uid?: string; Vend_name?: string }[] =
        response.data[0][0];

      const ltNos = [...new Set(data
        .map(item => item.TransNo)
        .filter((item): item is string => !!item && item !== '<<Select>>' && item !== '' && /^LT/.test(item))
      )];
      const dcNos = [...new Set(data.map(item => item.DcNo).filter((item): item is string => !!item && item !== '<<Select>>'))];
      const glNames = [...new Set(data.map(item => item.GLName).filter((item): item is string => !!item))];
      const vendNames = [...new Set(data.map(item => item.Vend_name).filter((item): item is string => !!item))];

      const formattedLtNos = [
        { label: '<<select>>', value: '<<select>>' },
        ...ltNos.map(no => ({
          label: no,
          value: no,
        })).sort((a, b) => a.label.localeCompare(b.label)),
      ];

      const formattedDcNos = [
        { label: '<<Select>>', value: '<<Select>>' },
        ...dcNos.map(no => ({
          label: no,
          value: no,
        })).sort((a, b) => a.label.localeCompare(b.label)),
      ];

      const formattedGlNames = glNames.map(name => ({
        label: name,
        value: name,
      }));

      const formattedVendNames = vendNames.map(name => ({
        label: name,
        value: name,
      })).sort((a, b) => a.label.localeCompare(b.label));

      setLtNoOptions(formattedLtNos);
      setBtNoOptions(formattedDcNos);
      setDcNoOptions(formattedDcNos);
      setPurAcOptions(formattedGlNames);
      setSupplierOptions(formattedVendNames);

      setPurAc(formattedGlNames.length > 0 ? formattedGlNames[0].value : 'PURCHASES');
      setLtNo('<<select>>');
      setBtNo('<<Select>>');
    } catch (err) {
      setError('Failed to fetch dropdown options.');
      showToast('Failed to fetch dropdown options.');
      setPurAc('PURCHASES');
      setLtNo('<<select>>');
      setBtNo('<<Select>>');
      setLtNoOptions([{ label: '<<select>>', value: '<<select>>' }]);
      setBtNoOptions([{ label: '<<Select>>', value: '<<Select>>' }]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBTNoOptionsByLTNo = async (destBranch: string, ltNo: string) => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(
        `${API_URL}/api/StockImportFromWareHouse/api/V1/GetDetails`,
        {
          params: {
            DestBranch: destBranch,
            LTNo: ltNo,
            Flag: 74,
          },
        }
      );

      const data: { DcNo: string; RefNo: string }[] = response.data[0][0];

      const dcNoToRefNoMap = data
        .filter(item => item.DcNo && item.DcNo !== '<<Select>>')
        .reduce((map, item) => {
          map[item.DcNo] = item.RefNo;
          return map;
        }, {} as Record<string, string>);

      const uniqueDcNos = [...new Set(data
        .filter(item => item.DcNo && item.DcNo !== '<<Select>>')
        .map(item => item.DcNo))];

      const formattedDcNos = [
        { label: '<<Select>>', value: '<<Select>>' },
        ...uniqueDcNos.map(dcNo => ({
          label: dcNoToRefNoMap[dcNo],
          value: dcNo
        })).sort((a, b) => a.label.localeCompare(b.label)),
      ];

      setBtNoOptions(formattedDcNos);
      setBtNo('<<Select>>');
    } catch (err) {
      setError('Failed to fetch BTNo options for the selected LTNo.');
      showToast('Failed to fetch BTNo options for the selected LTNo.');
      setBtNoOptions([{ label: '<<Select>>', value: '<<Select>>' }]);
      setBtNo('<<Select>>');
    } finally {
      setLoading(false);
    }
  };

  const FetchGetByIdBTNoDetails = async (destBranch: string, documentNo: string, documentType: 'BT' | 'LT') => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(
        `${API_URL}/api/StockImportFromWareHouse/api/V1/GetDetails`,
        {
          params: {
            DestBranch: destBranch,
            BTNo: documentType === 'BT' ? documentNo : undefined,
            LTNo: documentType === 'LT' ? documentNo : ltNo !== '<<select>>' ? ltNo : undefined,
            Flag: 31,
          },
        }
      );

      const items: any[] = response.data?.[0]?.[0];
      if (!Array.isArray(items)) {
        throw new Error('Invalid response structure');
      }

      let filteredItems: any[] = items;
      if (documentType === 'BT') {
        filteredItems = items.filter(item =>
          item.TransNo === documentNo &&
          (ltNo === '<<select>>' || item.LTNo === ltNo)
        );
      } else if (documentType === 'LT') {
        filteredItems = items.filter(item =>
          item.LTNo === documentNo &&
          (btNo === '<<Select>>' || item.TransNo === btNo)
        );
      }

      if (filteredItems.length === 0) {
        throw new Error(`No data found for the selected ${documentType} number`);
      }

      const formattedData: TableData[] = filteredItems.map(item => ({
        LTNo: String(item.LTNo || ''),
        TransDate: String(item.TransDate || ''),
        TransNo: String(item.TransNo || ''),
        PacketNo: String(item.PacketNo || ''),
        Itemcode: String(item.Itemcode || ''),
        HSNCode: String(item.HSNCode || ''),
        OEMCode: String(item.OEMCode || ''),
        ItemDesc: String(item.Itemdesc || ''),
        UOMId: String(item.UOMId || ''),
        Qty: String(item.Qty != null ? item.Qty : '0'),
        ScanQty: String(item.ScanQty != null ? item.ScanQty : '0'),
        PurchasePrice: String(item.PurchasePrice != null ? item.PurchasePrice : '0'),
        P_Distributor_rate: String(item.P_Distributor_rate != null ? item.P_Distributor_rate : '0'),
        MRP: String(item.MRP != null ? item.MRP : '0'),
        DiscountPrice: String(item.DiscountPrice != null ? item.DiscountPrice : '0'),
        Discount: String(item.Discount != null ? item.Discount : '0'),
        DisType: String(item.DisType || ''),
        Division: String(item.Division || ''),
        Department: String(item.Department || ''),
        Category: String(item.Category || ''),
        SubCategory: String(item.SubCategory || ''),
        Style: String(item.Style || ''),
        Design: String(item.Design || ''),
        Size: String(item.Size || ''),
        Color: String(item.Color || ''),
        Brand: String(item.Brand || ''),
        ArtName: String(item.Art_Name || ''),
        OutTaxID: String(item.OutTaxID || ''),
        OutTax: String(item.OutTax != null ? item.OutTax : '0'),
        OutTaxType: String(item.OutTaxType || ''),
        InTaxID: String(item.InTaxID || ''),
        Intax: String(item.InTax != null ? item.InTax : '0'),
        InTaxType: String(item.InTaxType || ''),
        Suppliername: String(item.SupplierName || ''),
        Verticle1: String(item.Verticle1 || ''),
        Verticle2: String(item.Verticle2 || ''),
        Verticle3: String(item.Verticle3 || ''),
        TokenType: String(item.TokenType || ''),
        Tokens: String(item.Tokens != null ? item.Tokens : '0'),
        Fabric: String(item.Fabric || ''),
        Divuid: String(item.Divuid || ''),
        SDMUid: String(item.SDMUid || ''),
        CatId: String(item.CatId || ''),
        SCMUid: String(item.SCMUid || ''),
        Styleid: String(item.Styleid || ''),
        DesId: String(item.DesId || ''),
        SizeId: String(item.SizeId || ''),
        ColorId: String(item.ColorId || ''),
        BrandId: String(item.BrandId || ''),
        SupplierId: String(item.SupplierId || ''),
        Art_Code: String(item.Art_Code || ''),
        P_Disc: String(item.P_Disc != null ? item.P_Disc : '0'),
        P_Disctype: String(item.P_DiscType || ''),
        TcsType: String(item.TcsType != null && typeof item.TcsType !== 'object' ? item.TcsType : ''),
        TcsAmt: String(item.TcsAmt != null && typeof item.TcsAmt !== 'object' ? item.TcsAmt : '0'),
        RoundOff: String(item.RoundOff != null && typeof item.RoundOff !== 'object' ? item.RoundOff : '0'),
      }));

      setTableData(formattedData);
      setRowCount(formattedData.length);

      // Apply modified C# CalculateTotalValue logic
      let totalTcs = 0.0;
      let totalRoundOff = 0.0;
      let totalValue = 0.0;
      let totalQty = 0.0;
      let totalScanQty = 0.0;
      let totalTaxAmt = 0.0;

      formattedData.forEach(item => {
        const scannedQty = parseFloat(item.ScanQty) || 0;
        const inTax = parseFloat(item.Intax) || 0;
        const mrp = parseFloat(item.MRP) || 0;
        const grossValue = scannedQty * mrp;

        // Tax calculation based on InTaxType
        let taxAmt = 0;
        if (item.InTaxType === 'I') {
          taxAmt = 0;
        } else if (item.InTaxType === 'E') {
          taxAmt = Math.abs(grossValue - (grossValue * ((100 + inTax) / 100)));
        }
        // console.log(grossValue);

        // TCS and RoundOff per unit
        if (scannedQty > 0) {
          try {
            const tcsAmt = parseFloat(item.TcsAmt) || 0;
            const roundOff = parseFloat(item.RoundOff) || 0;
            totalTcs += tcsAmt / scannedQty;
            totalRoundOff += roundOff / scannedQty;
          } catch (e) {
            totalTcs += 0;
            totalRoundOff += 0;
          }
        }

        // For totalValue, exclude tax amount
        totalValue += grossValue;
        totalTaxAmt += taxAmt;
      });

      // Calculate total quantities
      totalQty = formattedData.reduce((sum, item) => sum + (parseFloat(item.Qty) || 0), 0);
      totalScanQty = formattedData.reduce((sum, item) => sum + (parseFloat(item.ScanQty) || 0), 0);

      // Set state variables
      setTotalQty(totalQty);
      setTotalScanQty(totalScanQty);
      setTax(totalTaxAmt);
      setTcs(totalTcs);
      setRo(totalRoundOff);
      setTotalValue(totalValue + totalTcs + totalRoundOff);

      console.log({
        TotalQty: totalQty.toFixed(2),
        TotalScanQty: totalScanQty.toFixed(2),
        TotalTaxAmt: totalTaxAmt.toFixed(2),
        TotalTcs: totalTcs.toFixed(2),
        TotalRoundOff: totalRoundOff.toFixed(2),
        TotalMRPValue: (totalValue + totalTcs + totalRoundOff).toFixed(2),
      });
    } catch (err) {
      const errorMessage = `No data found for the selected ${documentType} number`;
      setError(errorMessage);
      showToast(errorMessage);
      setTableData([]);
      setRowCount(0);
      setTotalQty(0);
      setTotalScanQty(0);
      setTax(0);
      setTcs(0);
      setRo(0);
      setTotalValue(0);
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    fetchBranchDetails();
    if (destination) {
      fetchDropdownData();
    }
  }, [destination]);

  useEffect(() => {
    setTableData([]);
    setError('');
    setBtNo('<<Select>>');
    setBtNoOptions([{ label: '<<Select>>', value: '<<Select>>' }]);
  }, [ltNo, destination]);

  useEffect(() => {
    if (btNo !== '<<Select>>' && destination) {
      FetchGetByIdBTNoDetails(destination, btNo, 'BT');
    }
  }, [btNo]);

  const handleSave = async () => {
    if (!tableData.length || !source || !destination || !btNo || btNo === '<<Select>>') {
      showToast('Please ensure all required fields are filled and data is loaded.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        mrTotal: totalValue,
        sourceBranch: source,
        destBranch: destination,
        counterId: counterId,
        mat_SupplierId: '',
        importItems: tableData.map(item => ({
          itemcode: item.Itemcode || '',
          hsnCode: item.OEMCode,
          oemCode: '',
          itemDescription: item.ItemDesc || '',
          uomId: item.UOMId || '',
          qty: parseFloat(item.Qty).toFixed(2) || 0,
          purchasePrice: parseFloat(item.PurchasePrice).toFixed(2) || 0,
          mrp: parseFloat(item.MRP).toFixed(2) || '0',
          discount: parseFloat(item.P_Disc) || 0,
          disType: item.P_Disctype || '',
          discountPrice: parseFloat(item.DiscountPrice) || '0',
          division: item.Division || '',
          department: item.Department || '',
          category: item.Category || '',
          subCategory: item.SubCategory || '',
          style: item.Style || '',
          design: item.Design || '',
          size: item.Size || '',
          color: item.Color || '',
          brand: item.Brand || '',
          fabric: item.Fabric || '',
          artName: item.ArtName || '',
          tranNo: item.TransNo || '',
          tokens: item.Tokens?.toString() || '0',
          tax: parseFloat(item.OutTax) || 0,
          taxtype: item.InTaxType || 'I',
          packetNo: item.PacketNo?.toString() || '',
          counterId: counterId,
          inTax: parseFloat(item.Intax) || 0,
          inTaxtype: item.InTaxType || 'E',
          supplier: item.SupplierId || '',
          verticle1: item.Verticle1 || '',
          verticle2: item.Verticle2 || '',
          verticle3: item.Verticle3 || '',
          pDistr_Rate: parseFloat(item.P_Distributor_rate).toFixed(2) || 0.00,
          tokenType: item.TokenType || '',
          cgsT_Per: 0,
          cgsT_Amt: 0,
          sgsT_Per: 0,
          sgsT_Amt: 0,
          igsT_Per: parseFloat(item.Intax) || 0,
          igsT_Amt: ((parseFloat(item.Intax) || 0) * (parseFloat(item.Qty) || 0)) / 100 || 0,
          utgsT_Per: 0,
          utgsT_Amt: 0,
        })),
      };

      console.log('Saving to URL:', `${API_URL}/api/StockImportFromWareHouse/api/V1/Save`);
      console.log('Payload:', JSON.stringify(payload, null, 2));

      const response = await axios.post(
        `${API_URL}/api/StockImportFromWareHouse/api/V1/Save`,
        payload
      );

      if (response.data) {
        setError('');
        showToast(response.data || 'Stock saved successfully!');
        console.log('API Response:', response.data);
        setPurAc('');
        setLtNo('');
        setBtNo('');
        setScanInput('');
        setSource('');
        setDestination('');
        setRowCount(0);
        setTotalQty(0.00);
        setTotalScanQty(0.00);
        setTax(0);
        setTcs(0);
        setRo(0);
        setTotalValue(0.00);
        setTableData([]);
        fetchBranchDetails();
        fetchDropdownData();
      } else {
        throw new Error(response.data.message || 'Failed to save stock.');
      }
    } catch (err: any) {
      let errorMessage = 'Failed to save stock: Unknown error';
      if (err.response) {
        if (err.response.status === 404) {
          errorMessage = 'Failed to save stock: API endpoint not found. Please check the server configuration.';
        } else {
          errorMessage = `Failed to save stock: ${err.response.data?.message || err.message}`;
        }
        console.error('API Error:', {
          status: err.response.status,
          data: err.response.data,
          url: err.config.url,
        });
      } else {
        errorMessage = `Failed to save stock: ${err.message}`;
        console.error('Error:', err);
      }
      showToast(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setPurAc('');
    setLtNo('');
    setBtNo('');
    setScanInput('');
    setSource('');
    setDestination('');
    setRowCount(0);
    setTotalQty(0.00);
    setTotalScanQty(0.00);
    setTax(0);
    setTcs(0);
    setRo(0);
    setTotalValue(0.00);
    setTableData([]);
    setBtNoOptions([]);
    fetchBTNoOptionsByLTNo(destination, ltNo);
    fetchBranchDetails();
    fetchDropdownData();
    console.log('Clear button pressed');
  };

  const handleBarcodeScan = (code: string) => {
    setScanInput(code);
    setShowScanner(false);
    console.log('Processed barcode:', code);

    const itemIndex = tableData.findIndex(
      item => item.Itemcode === code && item.TransNo === btNo
    );

    if (itemIndex === -1) {
      showToast('Item not found for this barcode in the selected BTNo.');
      return;
    }

    const item = tableData[itemIndex];
    const currentScanQty = parseFloat(item.ScanQty) || 0;
    const maxQty = parseFloat(item.Qty) || 0;

    if (currentScanQty >= maxQty) {
      showToast('Scan quantity cannot exceed the total quantity.');
      setScanInput('');
      return;
    }

    const updatedTableData = [...tableData];
    updatedTableData[itemIndex] = {
      ...item,
      ScanQty: (currentScanQty + 1).toString(),
    };

    setTableData(updatedTableData);
    showToast(`Scan quantity updated for ${item.TransNo}`);
    setScanInput('');

    // Recalculate totals after scan
    let totalTcs = 0.0;
    let totalRoundOff = 0.0;
    let totalValue = 0.0;
    let totalQty = 0.0;
    let totalScanQty = 0.0;
    let totalTaxAmt = 0.0;

    updatedTableData.forEach(item => {
      const scannedQty = parseFloat(item.ScanQty) || 0;
      const inTax = parseFloat(item.Intax) || 0;
      const mrp = parseFloat(item.MRP) || 0;
      const grossValue = scannedQty * mrp;

      let taxAmt = 0;
      if (item.InTaxType === 'I') {
        taxAmt = 0;
      } else if (item.InTaxType === 'E') {
        taxAmt = Math.abs(grossValue - (grossValue * ((100 + inTax) / 100)));
      }

      if (scannedQty > 0) {
        try {
          const tcsAmt = parseFloat(item.TcsAmt) || 0;
          const roundOff = parseFloat(item.RoundOff) || 0;
          totalTcs += tcsAmt / scannedQty;
          totalRoundOff += roundOff / scannedQty;
        } catch (e) {
          totalTcs += 0;
          totalRoundOff += 0;
        }
      }
      console.log(grossValue);
      totalValue += grossValue;
      totalTaxAmt += taxAmt;
    });

    totalQty = updatedTableData.reduce((sum, item) => sum + (parseFloat(item.Qty) || 0), 0);
    totalScanQty = updatedTableData.reduce((sum, item) => sum + (parseFloat(item.ScanQty) || 0), 0);

    setTotalQty(totalQty);
    setTotalScanQty(totalScanQty);
    setTax(totalTaxAmt);
    setTcs(totalTcs);
    setRo(totalRoundOff);
    setTotalValue(totalValue + totalTcs + totalRoundOff);
  };

  const handleManualEntry = () => {
    if (!scanInput) {
      showToast('Please enter an item code.');
      return;
    }
    handleBarcodeScan(scanInput);
  };

  const tableHeaders = [
    'TransDate',
    'TransNo',
    'ItemDesc',
    'Qty',
    'ScanQty',
    'PurchasePrice',
    'Division',
    'Department',
    'Category',
    'Style',
    'Design',
    'Size',
    'Brand',
    'ArtName',
    'OutTax',
    'OutTaxType',
    'Intax',
    'InTaxType',
    'Suppliername',
    'Verticle1',
    'TokenType',
    'Tokens',
    'LTNo',
    'PacketNo',
    'Itemcode',
    'OemCode',
    'P_Disc',
    'P_Disctype',
  ];

  const renderTableHeader = () => (
    <View style={styles.tableRow}>
      {tableHeaders.map((header, index) => (
        <Text key={index} style={[styles.tableCell, styles.tableHeader]}>
          {header}
        </Text>
      ))}
    </View>
  );

  const renderTableRow = ({ item }: { item: TableData }) => (
    <View style={styles.tableRow}>
      <Text style={styles.tableCell}>{item.TransDate}</Text>
      <Text style={styles.tableCell}>{item.TransNo}</Text>
      <Text style={styles.tableCell}>{item.ItemDesc}</Text>
      <Text style={styles.tableCell}>{item.Qty}</Text>
      <Text style={styles.tableCell}>{item.ScanQty}</Text>
      <Text style={styles.tableCell}>{item.PurchasePrice}</Text>
      <Text style={styles.tableCell}>{item.Division}</Text>
      <Text style={styles.tableCell}>{item.Department}</Text>
      <Text style={styles.tableCell}>{item.Category}</Text>
      <Text style={styles.tableCell}>{item.Style}</Text>
      <Text style={styles.tableCell}>{item.Design}</Text>
      <Text style={styles.tableCell}>{item.Size}</Text>
      <Text style={styles.tableCell}>{item.Brand}</Text>
      <Text style={styles.tableCell}>{item.ArtName}</Text>
      <Text style={styles.tableCell}>{item.OutTax}</Text>
      <Text style={styles.tableCell}>{item.OutTaxType}</Text>
      <Text style={styles.tableCell}>{item.Intax}</Text>
      <Text style={styles.tableCell}>{item.InTaxType}</Text>
      <Text style={styles.tableCell}>{item.Suppliername}</Text>
      <Text style={styles.tableCell}>{item.Verticle1}</Text>
      <Text style={styles.tableCell}>{item.TokenType}</Text>
      <Text style={styles.tableCell}>{item.Tokens}</Text>
      <Text style={styles.tableCell}>{item.LTNo}</Text>
      <Text style={styles.tableCell}>{item.PacketNo}</Text>
      <Text style={styles.tableCell}>{item.Itemcode}</Text>
      <Text style={styles.tableCell}>{item.OEMCode}</Text>
      <Text style={styles.tableCell}>{item.P_Disc}</Text>
      <Text style={styles.tableCell}>{item.P_Disctype}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {Loading && (
          <View style={styles.spinnerContainer}>
            <ActivityIndicator size="large" color="#3498db" />
          </View>
        )}
        <Text style={styles.header}>Inward Stock (Item Wise)</Text>
        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>PUR/A.c.</Text>
            <Dropdown
              style={[styles.dropdown, { backgroundColor: '#fff' }]}
              selectedTextStyle={{ color: '#000' }}
              itemTextStyle={{ color: '#000' }}
              data={purAcOptions}
              labelField="label"
              valueField="value"
              value={purAc}
              placeholder="Select PUR/A.c."
              searchPlaceholderTextColor='#ccc'
              onChange={(item: { label: string; value: string }) => setPurAc(item.value)}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>DESTINATION :</Text>
            <Dropdown
              style={[styles.dropdown, { backgroundColor: '#fff' }]}
              selectedTextStyle={{ color: '#000' }}
              itemTextStyle={{ color: '#000' }}
              data={branchOptions}
              labelField="label"
              valueField="value"
              value={destination}
              placeholder="Select Destination"
              searchPlaceholderTextColor='#ccc'
              search
              searchPlaceholder="Search Here..."
              onChange={(item: { label: string; value: string }) => setDestination(item.value)}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>SOURCE :</Text>
            <Dropdown
              style={[styles.dropdown, { backgroundColor: '#fff' }]}
              selectedTextStyle={{ color: '#000' }}
              itemTextStyle={{ color: '#000' }}
              data={branchOptions}
              labelField="label"
              valueField="value"
              value={source}
              placeholder="Select Source"
              search
              searchPlaceholder="Search Here..."
              searchPlaceholderTextColor='#ccc'
              onChange={(item: { label: string; value: string }) => setSource(item.value)}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>L.T.NO :</Text>
            <Dropdown
              style={[styles.dropdown, { backgroundColor: '#fff' }]}
              selectedTextStyle={{ color: '#000' }}
              itemTextStyle={{ color: '#000' }}
              data={ltNoOptions}
              labelField="label"
              valueField="value"
              value={ltNo}
              placeholder="Select L.T.NO"
              search
              searchPlaceholder="Search Here..."
              searchPlaceholderTextColor='#ccc'
              onChange={(item: { label: string; value: string }) => {
                setLtNo(item.value);
                if (item.value !== '<<select>>' && destination) {
                  fetchBTNoOptionsByLTNo(destination, item.value);
                  FetchGetByIdBTNoDetails(destination, item.value, 'LT');
                } else {
                  setBtNoOptions([{ label: '<<Select>>', value: '<<Select>>' }]);
                  setBtNo('<<Select>>');
                  setTableData([]);
                }
              }}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>B.T.NO :</Text>
            <Dropdown
              style={[styles.dropdown, { backgroundColor: '#fff' }]}
              selectedTextStyle={{ color: '#000' }}
              itemTextStyle={{ color: '#000' }}
              data={btNoOptions}
              labelField="label"
              valueField="value"
              value={btNo}
              placeholder="Select B.T.NO"
              search
              searchPlaceholder="Search Here..."
              searchPlaceholderTextColor='#ccc'
              onChange={(item: { label: string; value: string }) => {
                setBtNo(item.value);
                if (item.value !== '<<Select>>' && destination) {
                  FetchGetByIdBTNoDetails(destination, item.value, 'BT');
                } else if (!destination) {
                  showToast('Please select a destination branch first.');
                }
              }}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>SCAN AREA :</Text>
            <TextInput
              style={styles.scanInput}
              value={scanInput}
              onChangeText={setScanInput}
              placeholder="PLEASE SCAN OR ENTER HERE.."
              placeholderTextColor="#666"
              onSubmitEditing={handleManualEntry}
            />
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
                <View style={[styles.modalContainer, { flex: 1, width: '50%', height: '50%', alignItems: "center", justifyContent: "center", left: "25%" }]}>
                  <BarcodeScanner
                    visible={showScanner}
                    onScan={handleBarcodeScan}
                    onClose={() => setShowScanner(false)}
                  />
                </View>
              </Modal>
            )}
          </View>
          {Loading && <Text style={styles.loadingText}>Loading data...</Text>}
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
        <View style={[styles.card, styles.tableContainer]}>
          <Text style={styles.tableTitle}>Stock Details</Text>
          <ScrollView horizontal>
            <View>
              {renderTableHeader()}
              <FlatList
                data={tableData}
                renderItem={renderTableRow}
                keyExtractor={(item, index) => index.toString()}
                ListEmptyComponent={<Text style={styles.emptyText}>No data available</Text>}
              />
            </View>
          </ScrollView>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <View style={[styles.card, styles.summaryCard]}>
          <View style={styles.summary}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Row</Text>
              <Text style={styles.summaryText}>{rowCount}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Qty</Text>
              <Text style={styles.summaryText}>{totalQty.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Scanned Qty</Text>
              <Text style={styles.summaryText}>{totalScanQty.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Tax</Text>
              <Text style={styles.summaryText}>{tax.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>TCS</Text>
              <Text style={styles.summaryText}>{tcs.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>R.O</Text>
              <Text style={styles.summaryText}>{ro.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Value</Text>
              <Text style={styles.summaryText}>{totalValue.toFixed(2)}</Text>
            </View>
          </View>
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.actionButton} onPress={handleSave}>
            <Text style={styles.buttonText}>SAVE</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleClear}>
            <Text style={styles.buttonText}>CLEAR</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 5,
    paddingBottom: 20,
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
  header: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    width: '100%',
    backgroundColor: '#4CAF50',
    padding: 10,
    marginBottom: 20,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  label: {
    width: 100,
    fontSize: 14,
    color: '#333',
  },
  dropdown: {
    flex: 1,
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  scanInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    textAlign: 'center',
  },
  scanButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginLeft: 10,
  },
  modalContainer: {
    flex: 1,
    width: '50%',
    height: '50%',
    alignItems: 'center',
    justifyContent: 'center',
    left: '25%',
  },
  footer: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#f9f9f9',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
    elevation: 1,
  },
  summaryCard: {
    marginVertical: 4,
  },
  summary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '30%',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
  },
  summaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#1e88e5',
    paddingVertical: 8,
    paddingHorizontal: 10,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
    elevation: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  errorText: {
    fontSize: 14,
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
  },
  tableContainer: {
    marginTop: 20,
  },
  tableTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e88e5',
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingVertical: 10,
  },
  tableHeader: {
    fontWeight: '700',
    color: '#333',
    backgroundColor: '#f0f0f0',
  },
  tableCell: {
    width: 120,
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    padding: 5,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
});

export default InwardStockIC;