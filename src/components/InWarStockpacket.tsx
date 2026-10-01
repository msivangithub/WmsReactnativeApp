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

const InwardStockpacket: React.FC<InwardStockProps> = ({ onBack }) => {
  const [Loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [purAc, setPurAc] = useState<string>('');
  const [purAcOptions, setPurAcOptions] = useState<btNoData[]>([]);
  const [packet, setPacket] = useState<string>('');
  const [btNo, setBtNo] = useState<string>('');
  const [packetNo, setPacketNo] = useState<btNoData[]>([{ label: '<<select>>', value: '<<select>>' }]);
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
  const [allTransNoData, setAllTransNoData] = useState<TableData[]>([]); // Store all data for TransNo
  const [isPacketDropdownEnabled, setIsPacketDropdownEnabled] = useState(false); // Control PacketNo dropdown

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
            Flag: 70,
          },
        }
      );

      const data: { TransNo?: string; DcNo?: string | {}; GLId?: string; GLName?: string; Vend_uid?: string; Vend_name?: string }[] =
        response.data[0][0];

      const btNos = [...new Set(data
        .map(item => item.TransNo)
        .filter((item): item is string => !!item && item !== '<<Select>>' && item !== '' && /^BT/.test(item))
      )];

      const dcNos = [...new Set(data
        .map(item => item.DcNo)
        .filter((item): item is string => typeof item === 'string' && !!item && item !== '<<Select>>')
      )];

      const glNames = [...new Set(data
        .map(item => item.GLName)
        .filter((item): item is string => !!item)
      )];

      const vendNames = [...new Set(data
        .map(item => item.Vend_name)
        .filter((item): item is string => !!item)
      )];

      const formattedbtNos = [
        { label: '<<Select>>', value: '<<Select>>' },
        ...btNos.map(no => ({
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

      setBtNoOptions(formattedbtNos);
      setDcNoOptions(formattedDcNos);
      setPurAcOptions(formattedGlNames);
      setSupplierOptions(formattedVendNames);

      setPurAc(formattedGlNames.length > 0 ? formattedGlNames[0].value : 'PURCHASES');
      setPacket('<<select>>');
      setBtNo('<<Select>>');

      // Clear table data and packet options
      setTableData([]);
      setAllTransNoData([]);
      setPacketNo([{ label: '<<select>>', value: '<<select>>' }]);
      setRowCount(0);
      setTotalQty(0);
      setTotalScanQty(0);
      setTax(0);
      setTcs(0);
      setRo(0);
      setTotalValue(0);
      setIsPacketDropdownEnabled(false);
    } catch (err) {
      setError('Failed to fetch dropdown options.');
      showToast('Failed to fetch dropdown options.');
      setPurAc('PURCHASES');
      setPacket('<<select>>');
      setBtNo('<<Select>>');
      setPacketNo([{ label: '<<select>>', value: '<<select>>' }]);
      setBtNoOptions([{ label: '<<Select>>', value: '<<Select>>' }]);
      setTableData([]);
      setAllTransNoData([]);
      setRowCount(0);
      setTotalQty(0);
      setTotalScanQty(0);
      setTax(0);
      setTcs(0);
      setRo(0);
      setTotalValue(0);
      setIsPacketDropdownEnabled(false);
    } finally {
      setLoading(false);
    }
  };

  const FetchGetByIdBTNoDetails = async (destBranch: string, transNo: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.get(
        `${API_URL}/api/StockImportFromWareHouse/api/V1/GetDetails`,
        {
          params: {
            DestBranch: destBranch,
            TransNo: transNo,
            Flag: 30,
          },
        }
      );

      const items: any[] = response.data?.[0]?.[0];

      if (!Array.isArray(items)) {
        throw new Error('Invalid response structure');
      }

      const formattedData: TableData[] = items.map(item => ({
        LTNo: item.LTNo || '',
        TransDate: item.TransDate || '',
        TransNo: item.TransNo || '',
        PacketNo: item.PacketNo && typeof item.PacketNo === 'object' ? '' : item.PacketNo || '',
        Itemcode: item.Itemcode || '',
        OEMCode: item.OEMCode || '',
        ItemDesc: item.Itemdesc || '',
        UOMId: item.UOMId || '',
        Qty: item.Qty != null ? item.Qty.toString() : '0',
        ScanQty: item.ScanQty != null ? item.ScanQty.toString() : '0',
        PurchasePrice: item.PurchasePrice != null ? item.PurchasePrice.toString() : '0',
        P_Distributor_rate: item.P_Distributor_rate != null ? item.P_Distributor_rate.toString() : '0',
        MRP: item.MRP != null ? item.MRP.toString() : '0',
        DiscountPrice: item.DiscountPrice != null ? item.DiscountPrice.toString() : '0',
        Discount: item.Discount != null ? item.Discount.toString() : '0',
        DisType: item.DisType || '',
        Division: item.Division || '',
        Department: item.Department || '',
        Category: item.Category || '',
        SubCategory: item.SubCategory || '',
        Style: item.Style || '',
        Design: item.Design || '',
        Size: item.Size || '',
        Color: item.Color || '',
        Brand: item.Brand || '',
        ArtName: item.Art_Name || '',
        OutTaxID: item.OutTaxID || '',
        OutTax: item.OutTax != null ? item.OutTax.toString() : '0',
        OutTaxType: item.OutTaxType || '',
        InTaxID: item.InTaxID || '',
        Intax: item.InTax != null ? item.InTax.toString() : '0',
        InTaxType: item.InTaxType || '',
        Suppliername: item.SupplierName || '',
        Verticle1: item.Verticle1 || '',
        Verticle2: item.Verticle2 || '',
        Verticle3: item.Verticle3 || '',
        TokenType: item.TokenType || '',
        Tokens: item.Tokens != null ? item.Tokens.toString() : '0',
        Fabric: item.Fabric || '',
        Divuid: item.Divuid || '',
        SDMUid: item.SDMUid || '',
        CatId: item.CatId || '',
        SCMUid: item.SCMUid || '',
        Styleid: item.Styleid || '',
        DesId: item.DesId || '',
        SizeId: item.SizeId || '',
        ColorId: item.ColorId || '',
        BrandId: item.BrandId || '',
        SupplierId: item.SupplierId || '',
        Art_Code: item.Art_Code || '',
        P_Disc: item.P_Disc != null ? item.P_Disc.toString() : '0',
        P_Disctype: item.P_DiscType || '',
        TcsType: item.TcsType != null && typeof item.TcsType !== 'object' ? item.TcsType.toString() : '',
        TcsAmt: item.TcsAmt != null && typeof item.TcsAmt !== 'object' ? item.TcsAmt.toString() : '0',
        RoundOff: item.RoundOff != null && typeof item.RoundOff !== 'object' ? item.RoundOff.toString() : '0',
      }));

      // Store all data for the TransNo
      setAllTransNoData(formattedData);

      // Populate PacketNo dropdown based on unique PacketNo values
      const uniquePacketNos = [...new Set(formattedData
        .map(item => item.PacketNo)
        .filter(p => p && p !== '')
      )];

      const formattedPacketNos = [
        { label: '<<select>>', value: '<<select>>' },
        ...uniquePacketNos.map(no => ({
          label: no,
          value: no,
        })).sort((a, b) => a.label.localeCompare(b.label)),
      ];

      setPacketNo(formattedPacketNos);
      setPacket('<<select>>');
      setIsPacketDropdownEnabled(true);

      // Initially show all data (no packet filter)
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
    } catch (err) {
      const errorMessage = `No data found for the selected TransNo`;
      setError(errorMessage);
      showToast(errorMessage);
      setTableData([]);
      setAllTransNoData([]);
      setPacketNo([{ label: '<<select>>', value: '<<select>>' }]);
      setPacket('<<select>>');
      setRowCount(0);
      setTotalQty(0);
      setTotalScanQty(0);
      setTax(0);
      setTcs(0);
      setRo(0);
      setTotalValue(0);
      setIsPacketDropdownEnabled(false);
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
    // Reset table data when destination changes
    setTableData([]);
    setAllTransNoData([]);
    setPacketNo([{ label: '<<select>>', value: '<<select>>' }]);
    setPacket('<<select>>');
    setRowCount(0);
    setTotalQty(0);
    setTotalScanQty(0);
    setTax(0);
    setTcs(0);
    setRo(0);
    setTotalValue(0);
    setError('');
    setIsPacketDropdownEnabled(false);
  }, [destination]);

  useEffect(() => {
    // Fetch table data only when a valid btNo is selected and destination is set
    if (btNo !== '<<Select>>' && btNo && destination) {
      FetchGetByIdBTNoDetails(destination, btNo);
    } else {
      // Clear table data if btNo is reset to '<<Select>>' or invalid
      setTableData([]);
      setAllTransNoData([]);
      setPacketNo([{ label: '<<select>>', value: '<<select>>' }]);
      setPacket('<<select>>');
      setRowCount(0);
      setTotalQty(0);
      setTotalScanQty(0);
      setTax(0);
      setTcs(0);
      setRo(0);
      setTotalValue(0);
      setError('');
      setIsPacketDropdownEnabled(false);
    }
  }, [btNo, destination]);

  useEffect(() => {
    // Filter table data based on selected PacketNo
    if (packet !== '<<select>>' && packet && allTransNoData.length > 0) {
      const filteredData = allTransNoData.filter(item => item.PacketNo === packet);
      setTableData(filteredData);
      setRowCount(filteredData.length);

      // Recalculate totals for filtered data
      let totalTcs = 0.0;
      let totalRoundOff = 0.0;
      let totalValue = 0.0;
      let totalQty = 0.0;
      let totalScanQty = 0.0;
      let totalTaxAmt = 0.0;

      filteredData.forEach(item => {
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
      totalQty = filteredData.reduce((sum, item) => sum + (parseFloat(item.Qty) || 0), 0);
      totalScanQty = filteredData.reduce((sum, item) => sum + (parseFloat(item.ScanQty) || 0), 0);

      // Set state variables
      setTotalQty(totalQty);
      setTotalScanQty(totalScanQty);
      setTax(totalTaxAmt);
      setTcs(totalTcs);
      setRo(totalRoundOff);
      setTotalValue(totalValue + totalTcs + totalRoundOff);
    } else if (allTransNoData.length > 0) {
      // Show all data if no packet is selected
      setTableData(allTransNoData);
      setRowCount(allTransNoData.length);

      // Recalculate totals for all data
      let totalTcs = 0.0;
      let totalRoundOff = 0.0;
      let totalValue = 0.0;
      let totalQty = 0.0;
      let totalScanQty = 0.0;
      let totalTaxAmt = 0.0;

      allTransNoData.forEach(item => {
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
      totalQty = allTransNoData.reduce((sum, item) => sum + (parseFloat(item.Qty) || 0), 0);
      totalScanQty = allTransNoData.reduce((sum, item) => sum + (parseFloat(item.ScanQty) || 0), 0);

      // Set state variables
      setTotalQty(totalQty);
      setTotalScanQty(totalScanQty);
      setTax(totalTaxAmt);
      setTcs(totalTcs);
      setRo(totalRoundOff);
      setTotalValue(totalValue + totalTcs + totalRoundOff);
    }
  }, [packet, allTransNoData]);

  const handleSync = () => {
    console.log('Sync button pressed');
  };

  const handleSave = async () => {
    if (!tableData.length || !source || !destination || !btNo || btNo === '<<Select>>') {
      showToast('Please ensure all required fields are filled and data is loaded.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        mrTotal: totalValue,
        sourceBranch: source,
        destBranch: destination,
        counterId: counterId,
        mat_SupplierId: '',
        importItems: tableData.map(item => ({
          itemcode: item.Itemcode || '',
          hsnCode: "",
          oemCode: item.OEMCode || '',
          itemDescription: item.ItemDesc || '',
          uomId: item.UOMId || '',
          qty: parseFloat(item.Qty) || 0,
          purchasePrice: parseFloat(item.PurchasePrice) || 0,
          mrp: item.MRP?.toString() || '0',
          discount: parseFloat(item.P_Disc) || 0,
          disType: item.P_Disctype || '',
          discountPrice: item.DiscountPrice?.toString() || '0',
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
          pDistr_Rate: item.P_Distributor_rate?.toString() || '0',
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
        setPacket('');
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
        setAllTransNoData([]);
        setBtNoOptions([]);
        setPacketNo([{ label: '<<select>>', value: '<<select>>' }]);
        setIsPacketDropdownEnabled(false);
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
    setPacket('');
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
    setAllTransNoData([]);
    setBtNoOptions([]);
    setPacketNo([{ label: '<<select>>', value: '<<select>>' }]);
    setIsPacketDropdownEnabled(false);
    fetchBranchDetails();
    fetchDropdownData();
    console.log('Clear button pressed');
  };

  const handleExit = () => {
    console.log('Exit button pressed');
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
    // Update allTransNoData to reflect the change
    const updatedAllTransNoData = allTransNoData.map(dataItem =>
      dataItem.Itemcode === item.Itemcode && dataItem.TransNo === item.TransNo
        ? { ...dataItem, ScanQty: (currentScanQty + 1).toString() }
        : dataItem
    );
    setAllTransNoData(updatedAllTransNoData);
    showToast(`Scan quantity updated for ${item.TransNo}`);
    setScanInput('');

    // Recalculate totals after scan
    let totalTcs = 0.0;
    let totalRoundOff = 0.0;
    let totalValue = 0.0;
    let totalQty = 0.0;
    let totalScanQty = 0.0;
    let totalTaxAmt = 0.0;

    const dataToCalculate = packet !== '<<select>>' && packet ? updatedTableData.filter(item => item.PacketNo === packet) : updatedTableData;

    dataToCalculate.forEach(item => {
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
    totalQty = dataToCalculate.reduce((sum, item) => sum + (parseFloat(item.Qty) || 0), 0);
    totalScanQty = dataToCalculate.reduce((sum, item) => sum + (parseFloat(item.ScanQty) || 0), 0);

    // Set state variables
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
    'LT No',
    'TransDate',
    'TransNo',
    'Packet No',
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
    'Intax',
    'InTaxType',
    'Suppliername',
    'Verticle1',
    'TokenType',
    'Tokens',
    'P_Disc',
    'P_Disctype',
    'Itemcode',
    'Oemcode',
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
      <Text style={styles.tableCell}>{item.LTNo}</Text>
      <Text style={styles.tableCell}>{item.TransDate}</Text>
      <Text style={styles.tableCell}>{item.TransNo}</Text>
      <Text style={styles.tableCell}>{item.PacketNo}</Text>
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
      <Text style={styles.tableCell}>{item.Intax}</Text>
      <Text style={styles.tableCell}>{item.InTaxType}</Text>
      <Text style={styles.tableCell}>{item.Suppliername}</Text>
      <Text style={styles.tableCell}>{item.Verticle1}</Text>
      <Text style={styles.tableCell}>{item.TokenType}</Text>
      <Text style={styles.tableCell}>{item.Tokens}</Text>
      <Text style={styles.tableCell}>{item.P_Disc}</Text>
      <Text style={styles.tableCell}>{item.P_Disctype}</Text>
      <Text style={styles.tableCell}>{item.Itemcode}</Text>
      <Text style={styles.tableCell}>{item.OEMCode}</Text>
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
        <Text style={styles.header}>Inward Stock (Packet Wise)</Text>
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
              onChange={(item: { label: string; value: string }) => setSource(item.value)}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Trans.NO :</Text>
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
              onChange={(item: { label: string; value: string }) => {
                setBtNo(item.value);
                if (item.value === '<<Select>>') {
                  setTableData([]);
                  setAllTransNoData([]);
                  setPacketNo([{ label: '<<select>>', value: '<<select>>' }]);
                  setPacket('<<select>>');
                  setRowCount(0);
                  setTotalQty(0);
                  setTotalScanQty(0);
                  setTax(0);
                  setTcs(0);
                  setRo(0);
                  setTotalValue(0);
                  setError('');
                  setIsPacketDropdownEnabled(false);
                } else if (destination) {
                  FetchGetByIdBTNoDetails(destination, item.value);
                } else {
                  showToast('Please select a destination branch first.');
                }
              }}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Packet.NO :</Text>
            <Dropdown
              style={[styles.dropdown, { backgroundColor: isPacketDropdownEnabled ? '#fff' : '#f0f0f0' }]}
              selectedTextStyle={{ color: '#000' }}
              itemTextStyle={{ color: '#000' }}
              data={packetNo}
              labelField="label"
              valueField="value"
              value={packet}
              placeholder="Select Packet.NO"
              search
              searchPlaceholder="Search Here..."
              onChange={(item: { label: string; value: string }) => {
                setPacket(item.value);
              }}
              disable={!isPacketDropdownEnabled}
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
  placeholder: {
    fontSize: 14,
    color: '#666',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
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
  inputtext: {
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

export default InwardStockpacket;