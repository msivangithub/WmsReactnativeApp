import React, { useState, useEffect, useRef ,useCallback} from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet, 
  ScrollView,
  KeyboardAvoidingView,
  Modal,
  FlatList,
  Alert, 
  ViewStyle,
  Button,
  Image,
  ActivityIndicator,
  Platform,
  KeyboardTypeOptions,
  TouchableWithoutFeedback,
  Dimensions,
  BackHandler,
  ToastAndroid
} from "react-native";
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import RNFS from 'react-native-fs';
import axios from "axios";
import { Calendar } from 'react-native-calendars';
import { Dropdown } from 'react-native-element-dropdown';
import icon from '../components/assests/settings.png';
// import leftarrow from '../components/assests/left_arrow.png';
import retailcliq from '../components/assests/retailcliqnew.png';
// import AutoDisplay from '../components/API.tsx';
// import {DEFAULT_API_URL } from '../components/api2.tsx';
import {  useApi } from "./APIcontext.tsx";
import UrlModal  from '../components/urlModal.tsx'
import  MainFile  from "./MainFile";
import Camera from '../components/Cameragallery.js';
import RNFS from 'react-native-fs';
// import { SERVER_IP, PORT } from 'react-native-dotenv';
// import { BASE_URL, PORT, API_URL} from '@env';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
// console.log(BASE_URL);  
// console.log(PORT);      

// const base_URL = SERVER_IP;
// const port = PORT; 
// const base_URL  = BASE_URL;
// const port  = PORT;
// const API_URL = `http://${base_URL}:${port}`;
// let  API_URL = 'http://120.138.9.33:5000';
// const API_URL = 'http://192.168.0.33:5001';

// console.log('API', API_URL);
// console.log('Base URL:', base_URL);
// console.log('Port:', port);
// console.log(BASE_URL);
// console.log(PORT);



interface BillDetail {
  slNo: string;
  billNo: string;
  billid: string;
  billDate: string;
  billSlNo: string;
  itemTag: string;
  itemName: string;
  brandTag: string;
  brandName: string;
  baleQty: string;
  noOfPieces: string;
  rate: string;
  bvalue: string;
  billDueDay: string;
  billduedate?: string;
  remarks: string;
}

interface FormState {
  lrId: string;
  courierNo: string;
  apoNo: string;
  parcelweight: string;
  transporter: string;
  productType: string;
  scanDoc: string;
  lrNo: string;
  type: string,
  shippingFrom: string;
  date: string;
  shippingTo: string;
  supplier: string;
  transCharge: string;
  paymentDate: string;
  otherCharges: string;
  totalValue: string;
  billDetail: BillDetail[];
  [key: string]: string | BillDetail[];
}
interface DetailData {
  label: string;
  value: string | number;
}

interface IncomingLogisticsScreenProps {
  onBack: () => void; 
}


type ProductType = {
  label: string;
  value: string;
};

const IncomingLogisticsScreen2 : React.FC<IncomingLogisticsScreenProps> = ({ onBack }) => {
  const [form, setForm] = useState<FormState>({
    lrId: "",
    courierNo: "",
    apoNo: "0",
    parcelweight: "0",
    transporter: "",
    productType: "",
    scanDoc: "",
    lrNo: "",
    type:"",
    shippingFrom: "",
    // date: new Date().toISOString().split("T")[0].split("-").reverse().join("-"),
    date:new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(',', '').split(' ').join('-'),
    shippingTo: "",
    supplier: "",
    transCharge: "",
    paymentDate: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(',', '').split(' ').join('-'),
    otherCharges: "0",
    totalValue: "",
    billDetail: [
      {
        slNo:'',
        billNo: "",
        billid:"",
        billDate: "",
        billSlNo: "",
        itemTag: "",
        itemName: "",
        brandTag: "",
        brandName: "",
        baleQty: "",
        noOfPieces: "",
        rate: "",
        bvalue: "",
        billDueDay: "",
        billduedate:"",
        remarks: "",
      },
    ],
  });
  const [isFormVisible, setIsFormVisible] = useState(false); 
  const [isReceiptFormVisible, setIsReceiptFormVisible] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isCalendarVisible, setCalendarVisible] = useState(false);
  const [calendarField, setCalendarField] = useState("");
  const [isVisible, setIsVisible] = useState(false); 
  const [fieldVisible, setFieldVisible] = useState(false);
  const [type, setType] = useState(0); 
  const [selectedValue, setSelectedValue] = useState('Goods Receipt '); 
  // const options = ['LR Receipt ', 'Goods Receipt ', 'Quotation  ']; 
  const options = ['LR Receipt ', 'Goods Receipt ']; 
  const initialFormState = { ...form };
  const [visibleOptions, setVisibleOptions] = useState<null | number>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDropdownVisible, setIsDropdownVisible] = useState(false); 
  const [isButtonVisible , setIsButtonVisible] = useState(false);
  const [inputValue, setInputValue] = useState<string>('');
  const [getDetailsData, setGetDetailsData] = useState<DetailData[]>([]);
  const [getByIDdata, setGetByIDdata] = useState<any>({}); 
  const [courierdata,setCourierdata] = useState([]);
  const [transportdata, setTransportdata] = useState([]);
  const [supplierdata, setSupplierdata] = useState([]);
  const [productdata, setProductdata] = useState<ProductType[]>([]);
  const [shippingdata, setShippingdata] = useState([]);
  const [itemdata, setItemdata] = useState<{ label: string; value: string }[]>([]);
  const [branddata, setBranddata] =useState<{ label: string; value: string }[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false); 
  const [editingItem, setEditingItem] = useState<BillDetail | null>(null);
  const [isBillAdded, setIsBillAdded] = useState(false);
  const billNoRef = useRef<TextInput[]>([]);
  const {API_URL, updateApiUrl} = useApi(); 
  const [isShowMode, setIsShowMode] = useState(false);
  const [selectedcourier, setSelectedCourier] = useState<{ value: string; label: string } | null>(null);
  const [selectedTransporter, setSelectedTransporter] = useState<{ value: string; label: string } | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<{ value: string; label: string } | null>(null);
  const [selectedProductType, setSelectedProductType] = useState<{ value: string; label: string } | null>(null);
  const [selectedShippingFrom, setSelectedShippingFrom] = useState<{ value: string; label: string } | null>(null);
  const [selectedShippingTo, setSelectedShippingTo] = useState<{ value: string; label: string } | null>(null);
  const [isDeleting , setIsDeleting] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const navigation = useNavigation();
  const [scanDocUrl, setScanDocUrl] = useState<string | null>(null);
  const [scanshow , setScanshow] = useState(false);
  const [isImageSelected, setIsImageSelected] = useState(false);
  const [disable, setDisable] = useState(false);
const [isFormLoading, setIsFormLoading] = useState(false);

  // useEffect(() => {
  //   if (form.scanDoc && form.scanDoc !== scanDocUrl) {
  //     setScanDocUrl(form.scanDoc);
  //   }
  // }, [form.scanDoc]);

    const showToast = (message: string) => {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    };
  

 useEffect(() => {
    const backAction = () => {
      onBack(); 
      return true; 
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [onBack]); 



  const handleshow = () => {
    setIsDropdownVisible((prev) => !prev); 
    setIsBillAdded(true);
    setIsButtonVisible((prevState) => !prevState);
    setIsShowMode(false);
    setScanshow(true);
  };

  // const handleImageSelected = (uri: string) => {
  //   setForm((prev) => ({ ...prev, scanDoc: uri })); // Update scanDoc in form state
  //   setIsImageSelected(false); // Mark image as selected
  //   // setScanDocUrl(null); // Clear scanDocUrl to avoid duplication
  // };

  const handleImageSelected = (uri: string) => {
  setForm((prev) => ({ ...prev, scanDoc: uri })); // Update scanDoc in form state
  setScanDocUrl(uri); // Update scanDocUrl to display the image
  setIsImageSelected(true); // Mark image as selected
  setScanshow(true); // Ensure the image is shown
};
const handleClearImage = () => {
  setForm(prev => ({ ...prev, scanDoc: "" }));
  setScanDocUrl(null);
  setIsImageSelected(false);
  setScanshow(false);
};
  // API for GetDetails
 // Fetch details function
 const fetchGetDetails = async () => {
  setLoading(true);
  setError("");

  try {
    const response = await axios.get(`${API_URL}/api/LRReceipt/api/V1/GetDetails?Type=${type}`);
    const getdetails = response.data[0]?.[0] || [];
    const formattedgetdetails = getdetails
      .map((item: { "LR Id": any; "LRorGR No": any }) => ({
        label: item["LRorGR No"],
        value: item["LR Id"],
      }))
      .sort((a: { value: number; }, b: { value: number; }) => a.value - b.value);
    setGetDetailsData(formattedgetdetails);
  } catch (err) {
    setError("Failed to fetch LRId.");
  } finally {
    setLoading(false);
  }
};

// Date Format For Bill Details  
const getMonthName = (month: number) => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months[month - 1] || "";
};

const formatDate = (dt: number) => {
  if (typeof dt !== 'number' || dt < 0) return "Invalid Date";
  
  const year = Math.floor(dt / 416) + 1950;
  const month = Math.floor((dt % 416) / 32);
  const day = (dt % 416) % 32;
  
  const formattedMonth = getMonthName(month);
  const formattedDay = String(day).padStart(2, '0');
  
  return `${formattedDay}-${formattedMonth}-${year}`;
};

// Date Format For Bill Due Date 
const getMonthNamed = (month: number) => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months[month - 1] || "";
};

const isLeapYear = (year: number) => {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
};

const isValidDate = (year: number, month: number, day: number) => {
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  // Leap year check for February
  if (month === 2 && isLeapYear(year)) {
    daysInMonth[1] = 29;
  }
  return month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth[month - 1];
};

const formatedDate = (dt: number) => {
  if (typeof dt !== "number" || dt < 0) {
    return "Invalid Date";
  }

  let year = Math.floor(dt / 416) + 1950;
  let month = Math.floor((dt % 416) / 32);
  let day = (dt % 416) % 32;

  const dateObj = new Date(year, month - 1, day); 
  year = dateObj.getFullYear();
  month = dateObj.getMonth() + 1;
  day = dateObj.getDate();

  if (!isValidDate(year, month, day)) return "Invalid Date";

  const formattedMonth = getMonthNamed(month);
  const formattedDay = String(day).padStart(2, "0");

  return `${formattedDay}-${formattedMonth}-${year}`;
};

const getScanDocUrl = (scanDocPath: string): string => {
  if (!scanDocPath || typeof scanDocPath !== "string") {
    console.log("Invalid scanDocPath, using fallback:", scanDocPath);
    return "";
  }

  const baseURL = `${API_URL}/ProtectedUplodFiles`;
  const fileName = scanDocPath.split("\\").pop();
  const timestamp = new Date().getTime();

  return `${baseURL}/${fileName}?t=${timestamp}`;
};

// API for GetById
// const fetchGetBYID = async (id = inputValue) => {
//   if (!id) {
//     setError('LRId is required.');
//     return;
//   }
//        setLoading(true);
//        setError('');
     
//        try {
//          // Fetch all the required lists first
//          await Promise.all([
//            fetchCouriers(),
//            fetchTransporters(),
//            fetchSuppliers(),
//            fetchProduct(),
//            fetchShipping(),
//            fetchItem(),
//            fetchBrand()
//          ]);
     
//          const response = await axios.get<any[]>(`${API_URL}/api/LRReceipt/api/V1/GetByIdDetails?LRId=${id}`);
//          const getbyID = response.data[0]?.[0] || [];
     
//          // Helper function to find label by value in dropdown data
//          const findLabelByValue = (data: any[], value: string) => {
//            const item = data.find(item => item.value === value);
//            return item ? item.label : value;
//          };
          
//          // Transform the data to match the FormState interface
//           const formattedGetbyID: FormState = {
//            lrId: getbyID[0]?.LRId ,
//            courierNo: getbyID[0]?.CoverNo , 
//            apoNo: getbyID[0]?.PONo ,
//            parcelweight: getbyID[0]?.Desc5 ,
//            transporter: getbyID[0]?.Transporter ,
//            productType: getbyID[0]?.ProductType ,
//            scanDoc: getbyID[0]?.Desc6.toString(),
//           // scanDoc: getScanDocUrl(getbyID[0]?.Desc6.toString()), 
//            lrNo: getbyID[0]?.['LR/GRNo'] ,
//            type: getbyID[0]?.Type,
//            shippingFrom: getbyID[0]?.ShippingFrom ,
//            date: formatDate(getbyID[0]?.LRDate),
//            shippingTo: getbyID[0]?.ShippingTo,
//            supplier: getbyID[0]?.Supplier,
//            transCharge: getbyID[0]?.Desc2, 
//            paymentDate: formatDate(getbyID[0]?.PODate), 
//            otherCharges: getbyID[0]?.OtherCharges?.toString(),
//            totalValue: getbyID[0]?.TotValue?.toString(), 
//            billDetail: getbyID.slice(1).map((bill: any) => ({
//              slNo: bill.RowId ,
//              billNo: bill.BillNo ,
//              billid: bill.BillId,
//              billDate: formatDate(bill.BillDate) ,
//             // billDate:(bill.BillDate),
//              billSlNo: bill.BillSlNo?.toString(),
//              itemTag: bill.Item ,
//              itemName: findLabelByValue(itemdata, bill.Item),
//              brandTag: bill.Brand,
//              brandName: findLabelByValue(branddata, bill.Brand),
//             //  baleQty: bill.BaleQty?.toString() ,
//             baleQty: bill.BaleQty?.toString() ,
//              noOfPieces: bill.NoOfPieces?.toString(),
//              rate: bill.Rate?.toString() ,
//              bvalue: bill.value?.toString() ,
//              billDueDay: bill.Val1?.toString(),
//              billduedate: formatedDate((bill.BillDate) + (bill.Val1)),
//              remarks: bill.Other ,
//            }))
//          };
//         //  setScanDocUrl(formattedGetbyID.scanDoc);
//         setScanDocUrl(getScanDocUrl(getbyID[0]?.Desc6.toString()));
//          console.log(formattedGetbyID);
//          setGetByIDdata(formattedGetbyID);
//          setForm(formattedGetbyID);
//         //  setIsEditing(true);
//         // setIsShowMode(true); 
//          setSelectedCourier({ value: formattedGetbyID.courierNo, label: findLabelByValue(courierdata, formattedGetbyID.courierNo) });
//          setSelectedTransporter({ value: formattedGetbyID.transporter, label: findLabelByValue(transportdata, formattedGetbyID.transporter) });
//          setSelectedSupplier({ value: formattedGetbyID.supplier, label: findLabelByValue(supplierdata, formattedGetbyID.supplier) });
//          setSelectedProductType({ value: formattedGetbyID.productType, label: findLabelByValue(productdata, formattedGetbyID.productType) });
//          setSelectedShippingFrom({ value: formattedGetbyID.shippingFrom, label: findLabelByValue(shippingdata, formattedGetbyID.shippingFrom) });
//          setSelectedShippingTo({ value: formattedGetbyID.shippingTo, label: findLabelByValue(shippingdata, formattedGetbyID.shippingTo) });
     
//        } catch (err) {
//          setError('Failed to fetch details for LRId.');
//          console.error('Error fetching details:', err);
//        } finally {
//          setLoading(false);
//        }
//      };

const fetchGetBYID = async (id= inputValue) => {
    if (!id) {
    setError('LRId is required.');
    return;
  }

  setIsFormLoading(true); // Use dedicated loading flag for form population
  setLoading(true);
  try {
     const response = await axios.get<any[]>(`${API_URL}/api/LRReceipt/api/V1/GetByIdDetails?LRId=${id}`);
    const data = response.data[0]?.[0];
       const getbyID = response.data[0]?.[0] || [];
    if (!data) {
      showToast("No data found for this ID");
      return;
    }
      const findLabelByValue = (data: any[], value: string) => {
           const item = data.find(item => item.value === value);
           return item ? item.label : value;
         };

     const formattedGetbyID: FormState = {
           lrId: getbyID[0]?.LRId ,
           courierNo: getbyID[0]?.CoverNo , 
           apoNo: getbyID[0]?.PONo ,
           parcelweight: getbyID[0]?.Desc5 ,
           transporter: getbyID[0]?.Transporter ,
           productType: getbyID[0]?.ProductType ,
           scanDoc: getbyID[0]?.Desc6.toString(),
          // scanDoc: getScanDocUrl(getbyID[0]?.Desc6.toString()), 
           lrNo: getbyID[0]?.['LR/GRNo'] ,
           type: getbyID[0]?.Type,
           shippingFrom: getbyID[0]?.ShippingFrom ,
           date: formatDate(getbyID[0]?.LRDate),
           shippingTo: getbyID[0]?.ShippingTo,
           supplier: getbyID[0]?.Supplier,
           transCharge: getbyID[0]?.Desc2, 
           paymentDate: formatDate(getbyID[0]?.PODate), 
           otherCharges: getbyID[0]?.OtherCharges?.toString(),
           totalValue: getbyID[0]?.TotValue?.toString(), 
           billDetail: getbyID.slice(1).map((bill: any) => ({
             slNo: bill.RowId ,
             billNo: bill.BillNo ,
             billid: bill.BillId,
             billDate: formatDate(bill.BillDate) ,
            // billDate:(bill.BillDate),
             billSlNo: bill.BillSlNo?.toString(),
             itemTag: bill.Item ,
             itemName: findLabelByValue(itemdata, bill.Item),
             brandTag: bill.Brand,
             brandName: findLabelByValue(branddata, bill.Brand),
            //  baleQty: bill.BaleQty?.toString() ,
            baleQty: bill.BaleQty?.toString() ,
             noOfPieces: bill.NoOfPieces?.toString(),
             rate: bill.Rate?.toString() ,
             bvalue: bill.value?.toString() ,
             billDueDay: bill.Val1?.toString(),
             billduedate: formatedDate((bill.BillDate) + (bill.Val1)),
             remarks: bill.Other ,
           }))
         };
        //  setScanDocUrl(formattedGetbyID.scanDoc);
        setScanDocUrl(getScanDocUrl(getbyID[0]?.Desc6.toString()));
         console.log(formattedGetbyID);
         setGetByIDdata(formattedGetbyID);
         setForm(formattedGetbyID);
        //  setIsEditing(true);
        // setIsShowMode(true); 
         setSelectedCourier({ value: formattedGetbyID.courierNo, label: findLabelByValue(courierdata, formattedGetbyID.courierNo) });
         setSelectedTransporter({ value: formattedGetbyID.transporter, label: findLabelByValue(transportdata, formattedGetbyID.transporter) });
         setSelectedSupplier({ value: formattedGetbyID.supplier, label: findLabelByValue(supplierdata, formattedGetbyID.supplier) });
         setSelectedProductType({ value: formattedGetbyID.productType, label: findLabelByValue(productdata, formattedGetbyID.productType) });
         setSelectedShippingFrom({ value: formattedGetbyID.shippingFrom, label: findLabelByValue(shippingdata, formattedGetbyID.shippingFrom) });
         setSelectedShippingTo({ value: formattedGetbyID.shippingTo, label: findLabelByValue(shippingdata, formattedGetbyID.shippingTo) });
     
  } catch (err) {
    console.error('Error fetching details:', err);
    setError('Failed to fetch details');
    showToast("Failed to load data");
  } finally {
    setLoading(false);
    // Keep isFormLoading true until effect confirms render?
  }
};

useEffect(() => {
   if (inputValue) {
    fetchGetBYID();
  }
}, [inputValue , API_URL]);

console.log(inputValue);
// console.log(getByIDdata);
console.log(getDetailsData);

  // API for CourierList
const fetchCouriers = async () => {
    setLoading(true);
    setError('');
  
    try {
      const response = await axios.get(`${API_URL}/api/LRReceipt/api/V1/GetCourierList`);
      const couriers = response.data[0]?.[0] || [];
      const formattedcouriers = couriers.map((item: { CourierNumber: any; CoverId: any }) => ({
        label: item.CoverId,
        value: item.CourierNumber,
      }));
      setCourierdata(formattedcouriers);
    } catch (err) {
      setError('Failed to fetch CourierNo.');
    } finally {
      setLoading(false);
    }
  };
  

 
  // API for TransporterList
const fetchTransporters = async () => {
  setLoading(true);
  setError('');

  try {
    const response = await axios.get(`${API_URL}/api/LRReceipt/api/V1/GetTransporterList`);
    const transporters = response.data[0]?.[0] || [];
    const formattedTransporters = transporters.map((item: { Transportname: any; TransportId: any }) => ({
      label: item.Transportname,
      value: item.TransportId,
    }));
    setTransportdata(formattedTransporters);
  } catch (err) {
    setError('Failed to fetch transporter');
  } finally {
    setLoading(false);
  }
};


// API for SupplierList

  const fetchSuppliers = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.get(`${API_URL}/api/LRReceipt/api/V1/GetSupplierList`);
     
      const Suppliers = response.data[0]?.[0] || [];
      const formattedSuppliers =  Suppliers.map((item: { SupplierName: any; SupplierId: any; city: any}) => ({
        label: item.SupplierName, 
        value: item.SupplierId,
        city: item.city   
      }));
      setSupplierdata(formattedSuppliers);
    } catch (err) {
      setError('Failed to fetch Supplier');
    } finally {
      setLoading(false);
    }
  };

 

// API for ProductList
  const fetchProduct = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.get(`${API_URL}/api/LRReceipt/api/V1/GetProductList`);
     
      const Product = response.data[0]?.[0] || [];
      const formattedProduct =  Product.map((item: { ProductTypeName: any; ProducttypeId: any; }) => ({
        label: item.ProductTypeName, 
        value: item.ProducttypeId,  
      }));
      setProductdata(formattedProduct);
    } catch (err) {
      setError('Failed to fetch ProductType');
    } finally {
      setLoading(false);
    }
  };

// API for  ShippingList
  // const fetchShipping = async () => {
  //   setLoading(true);
  //   setError('');

  //   try {
  //     const response = await axios.get(`${API_URL}/api/LRReceipt/api/V1/GetCityList`);
     
  //     const Shipping = response.data[0]?.[0] || [];
  //     const formattedShipping = Shipping.map((item: { [x: string]: any; }) => ({
  //       label: item["City Name"],  
  //       value: item["City Id"],    
  //     }));
  //     setShippingdata(formattedShipping);
  //   } catch (err) {
  //     setError('Failed to fetch City');
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const fetchShipping = async () => {
    setLoading(true);
    setError('');
  
    try {
      const response = await axios.get(`${API_URL}/api/LRReceipt/api/V1/GetCityList`);
  
      const Shipping = response.data[0]?.[0] || [];
      const formattedShipping = Shipping.map((item: { [x: string]: any; }) => ({
        label: item["City Name"],  
        value: item["City Id"],    
      }));
  
      setShippingdata(formattedShipping);
  
      // Find Hyderabad and set default
      const defaultCity = formattedShipping.find((city: { label: string; }) => city.label === "Hyderabad");
  
      if (defaultCity) {
        setForm(prevForm => ({
          ...prevForm,
          shippingTo: defaultCity.value, // CityId
        }));
      }
  
    } catch (err) {
      setError('Failed to fetch City');
    } finally {
      setLoading(false);
    }
  };


// API for  ItemList
const fetchItem = useCallback(async () => {
  setItemdata([]);
  setLoading(true);
  setError('');
  try {
    const response = await axios.get(`${API_URL}/api/LRReceipt/api/V1/GetItemList`);
    const Item = response.data[0]?.[0] || [];
    const formattedItem = Item.map((item: { [x: string]: any; }) => ({
      label: item["Item Name"],
      value: item["Item Code"],
    }));
    setItemdata(formattedItem);
  } catch (err) {
    setError('Failed to fetch items');
  } finally {
    setLoading(false);
  }
}, [API_URL]);
// console.log(itemdata);
// useEffect(() => {
//   fetchItem();
//   fetchBrand();
// }, [fetchItem, fetchBrand]); 

// API for  BrandList
 const fetchBrand = useCallback(async () => {
  setBranddata([]);
  setLoading(true);
  setError('');
  try {
    const response = await axios.get(`${API_URL}/api/LRReceipt/api/V1/GetBrandList`);
    const Brand = response.data[0]?.[0] || [];
    const formattedBrand = Brand.map((item: { [x: string]: any; }) => ({
      label: item["Brand Name"],
      value: item["Brand Id"],
    }));
    setBranddata(formattedBrand);11
  } catch (err) {
    setError('Failed to fetch Brand');
  } finally {
    setLoading(false);
  }
}, [API_URL]);

useEffect(() => {
  fetchItem();
  fetchBrand();
}, [fetchItem,   fetchBrand]); 


// Default selection for Product Type
useEffect(() => {
  if (!form.productType && productdata.length > 0) {
    const defaultValue = productdata[0].value;
    if (form.productType !== defaultValue) {
      setForm((prevForm) => ({
        ...prevForm,
        productType: defaultValue,
      }));
    }
  }
}, [productdata]);


// Default selection for Bill Details 
useEffect(() => {
  if (itemdata.length > 0 || branddata.length > 0 || itemdata.length!=null || branddata.length!=null) {
    const defaultItem = itemdata[0];
    const defaultBrand = branddata[0];

    setForm((prevForm) => {
      const newBillDetail = prevForm.billDetail.map((bill, index) => {
        if (index === prevForm.billDetail.length - 1) {
          return {
            ...bill,
            itemName: bill.itemName || defaultItem?.label ,
            itemTag: bill.itemTag || defaultItem?.value,
            brandName: bill.brandName || defaultBrand?.label,
            brandTag: bill.brandTag || defaultBrand?.value,
            baleQty: bill.baleQty ,
            noOfPieces: bill.noOfPieces || "1",
            rate: bill.rate || "1",
            bvalue: bill.bvalue || "1",
            billDueDay: bill.billDueDay || "0",
            // billduedate: bill.billduedate || new Date().toISOString().split("T")[0].split("-").reverse().join("-"),
            billduedate: bill.billduedate || new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(',', '').split(' ').join('-') ,
          };
        }
        return bill;
      });

      const isBillDetailChanged = newBillDetail.some(
        (bill, index) => JSON.stringify(bill) !== JSON.stringify(prevForm.billDetail[index])
      );

      if (isBillDetailChanged) {
        return { ...prevForm, billDetail: newBillDetail };
      }

      return prevForm;
    });
  }
}, [itemdata, branddata, form.billDetail]); 
console.log('Itemdata',itemdata);
console.log('BrandData', branddata);


// For fetching the Data
useEffect(() => {
  setGetDetailsData([]);
  setGetByIDdata([]);
  setCourierdata([]);
  setTransportdata([]);
  setSupplierdata([]);
  setProductdata([]);
  setShippingdata([]);
  setItemdata([]);
  setBranddata([]);
  
  // Then fetch new data
  fetchGetDetails();
  fetchGetBYID();
  fetchCouriers();
  fetchTransporters();
  fetchSuppliers();
  fetchProduct();
  fetchShipping();
  fetchItem();
  fetchBrand();
}, [API_URL, type]);

// Function to get the label from the value (for both item and brand)
// const getLabelFromValue = (data: any[], label: string) => {
//   const selectedItem = data.find((item) => item.label === label);
//   return selectedItem ? selectedItem.label : data[0]?.label || '';
// };

const getLabelFromValue = (data: any[], label: string) => {
  const selectedItem = data.find((item) => item.label === label);
  return selectedItem ? { label: selectedItem.label, value: selectedItem.value } : { label: data[0]?.label || '', value: data[0]?.value || '' };
};


  const toggleOptions = (index : any) => {
    if (visibleOptions === index) {
      setVisibleOptions(null); 
    } else {
      setVisibleOptions(index); 
    }
  };

  // const handleEdit = (item: BillDetail) => {
  //   Alert.alert("Edit Item", `You selected ${item.billNo} to edit.`);
  
  //   const updatedbillDetail = form.billDetail.map((bill) =>
  //     bill.billNo === item.billNo
  //       ? { ...bill, 
  //          itemName: item.itemName || '',
  //          brandName: item.brandName || '',
  //          qty: item.baleQty || '', 
  //          noOfPieces: item.noOfPieces || '',
  //          rate: item.rate || '', 
  //         //  value: item.bvalue || '',
  //          billDueDay: item.billDueDay || '',
  //         //  billDate: item.billDate || '', 
  //          remarks: item.remarks || '' 
  //         }
  //       : bill
  //   );
  
  //   setForm((prevForm) => ({
  //     ...prevForm,
  //     billDetail: updatedbillDetail,
  //   }));
  // };
  // const handleEdit = (item: BillDetail) => {
  //   Alert.alert("Edit Item", `You selected ${item.billNo} to edit.`);
  
  //   // Update the `billDetail` array with the edited values
  //   const updatedbillDetail = form.billDetail.map((bill) => {
  //     if (bill.billNo === item.billNo) {
  //       const updatedBill = {
  //         ...bill,
  //         itemName: item.itemName || "",      
  //         brandName: item.brandName || "",   
  //         qty: item.baleQty || "",          
  //         noOfPieces: item.noOfPieces || "", 
  //         rate: item.rate || "",             
  //         billDueDay: item.billDueDay || "", 
  //         remarks: item.remarks || "",       
  //       };
  
  //       // Set default `billDate` if it is not provided
  //       updatedBill.billDate = item.billDate || new Date().toISOString().split("T")[0].split("-").reverse().join("-");
  
  //       // Calculate `bvalue`
  //       updatedBill.bvalue = calculateValue(
  //         parseFloat(updatedBill.rate) || 0,
  //         parseFloat(updatedBill.noOfPieces) || 0
  //       );
  
  //       // Calculate `billduedate` if `billDueDay` is provided
  //       if (updatedBill.billDueDay && updatedBill.billDate) {
  //         const dueDays = parseInt(updatedBill.billDueDay, 10);
  //         if (!isNaN(dueDays)) {
  //           const billDate = new Date(updatedBill.billDate);
  //           const dueDate = new Date(billDate);
  //           dueDate.setDate(billDate.getDate() + dueDays); 
  //           updatedBill.billduedate = dueDate.toISOString().split("T")[0];
  //         } else {
  //           updatedBill.billduedate = ""; 
  //         }
  //       } else {
  //         updatedBill.billduedate = ""; 
  //       }
  
  //       return updatedBill;
  //     }
  
  //     return bill; 
  //   });
  
  //   // Update the form state with the modified `billDetail`
  //   setForm((prevForm) => ({
  //     ...prevForm,
  //     billDetail: updatedbillDetail,
  //   }));
  // };
  
  
  
// const updatebillDetail = (updatedItem: BillDetail) => {
//   // Validate the new record fields before updating
//   if (!updatedItem.itemName || !updatedItem.baleQty || !updatedItem.rate) {
//     Alert.alert("Validation Error", "Please fill in all required fields.");
//     return;
//   }

//   // Remove the old record and add the new one
//   const updatedbillDetail = [
//     ...form.billDetail.filter((bill) => bill.billNo !== updatedItem.billNo),
//     updatedItem, // Add the new record
//   ];

//   // Update the form state with the new billDetail array
//   setForm((prevForm) => ({
//     ...prevForm,
//     billDetail: updatedbillDetail,
//   }));

//   // Notify the user that the changes have been saved
//   Alert.alert("Save", "Your changes have been saved successfully!");

//   // Log the updated bill details for debugging
//   console.log("Updated Bill Details:", updatedbillDetail);
// };

  
  

  // Delete the selected BillDetail
  // const updatebillDetail = (updatedItem: BillDetail) => {
  //   if (!updatedItem.itemName || !updatedItem.baleQty || !updatedItem.rate) {
  //     Alert.alert("Validation Error", "Please fill in all required fields.");
  //     return;
  //   }
  
  //   const updatedbillDetail = [
  //     ...form.billDetail.filter((bill) => bill.billNo !== updatedItem.billNo),
  //     updatedItem, 
  //   ];
  
  //   // Update the form state with the new billDetail array
  //   setForm((prevForm) => ({
  //     ...prevForm,
  //     billDetail: updatedbillDetail,
  //   }));
  
    
  //   // Notify the user that the changes have been saved
  //   Alert.alert("Save", "Your changes have been saved successfully!");
  
  //   console.log("Updated Bill Details:", updatedbillDetail);
  // };

  // const handleBillEdit = (item: BillDetail) => {
  //   Alert.alert(
  //     'Edit Bill',
  //     'Are you sure you want to edit this bill?',
  //     [
  //       { text: 'Cancel', style: 'cancel' }, 
  //       {
  //         text: 'Edit',
  //         onPress: () => {
  //           setIsEditing(true);            
  //           setEditingItem(item);          
  //           updatebillDetail(item);        
  //         },
  //       },
  //     ]
  //   );
  // };
  const handleBillEdit = (item: BillDetail) => {
    Alert.alert("Edit Bill", "Are you sure you want to edit this bill?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Edit",
        onPress: () => {
          setIsEditing(true);
          // setEditingItem({ ...item }); 
          setEditingItem({ ...item, billNo: item.billNo }); 
        },
      },
    ]);
  };
  
  const currentItem = isEditing ? editingItem : form.billDetail[form.billDetail.length - 1] ?? null;

  
  // const handleAddOrUpdateBill = () => {
  //   if (isEditing) {
  //     if (editingItem) {
  //       updatebillDetail(editingItem); // Only call if editingItem is not null
  //       setIsEditing(false);
  //       // setEditingItem(null); 
  //             setForm((prev) => {
  //       const updatedBillDetail = [
  //         ...prev.billDetail,
  //         {
  //           slNo: (prev.billDetail.length + 1).toString(),
  //           billNo: "",
  //           // billDate: new Date().toISOString().split("T")[0],
  //           billDate:new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(',', '').split(' ').join('-'),
  //           billSlNo: "",
  //           itemTag: "",
  //           itemName: "",
  //           brandTag: "",
  //           brandName: "",
  //           baleQty: "",
  //           noOfPieces: "",
  //           rate: "",
  //           bvalue: "",
  //           billDueDay: "",
  //           billduedate: "",
  //           remarks: "",
  //         },
  //       ];

  //       return { ...prev, billDetail: updatedBillDetail };
  //     });
  //     }
  //   } else {
  //     handleAddBillDetail(); 
  //   }
  // };
  
// const handleAddOrUpdateBill = () => {
//   if (isEditing) {
//     if (editingItem) {
//       // Validation for editing an item
//       if (editingItem.billSlNo === "1" && (!editingItem.baleQty || editingItem.baleQty === "0")) {
//         Alert.alert("Error", "Please fill Bale Quantity before saving.");
//         return;
//       }

//       updatebillDetail(editingItem);
//       setIsEditing(false);

//       // Reset form after editing
//       setForm((prev) => {
//         const updatedBillDetail = [
//           ...prev.billDetail,
//           {
//             slNo: (prev.billDetail.length + 1).toString(),
//             billNo: "",
//             billDate: new Date()
//               .toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
//               .replace(",", "")
//               .split(" ")
//               .join("-"),
//             billSlNo: "",
//             itemTag: "",
//             itemName: "",
//             brandTag: "",
//             brandName: "",
//             baleQty: "",
//             noOfPieces: "",
//             rate: "",
//             bvalue: "",
//             billDueDay: "",
//             billduedate: "",
//             remarks: "",
//           },
//         ];
//         console.log('Updated Add bill', updatebillDetail);
//         return { ...prev, billDetail: updatedBillDetail };
//       });
//     }
//   } else {
//     const lastItem = form.billDetail[form.billDetail.length - 1];

//     // Ensure at least one entry exists before adding a new one
//     if (!lastItem) {
//       Alert.alert("Error", "Please enter at least one bill entry before adding a new one.");
//       return;
//     }

//     // Validation for required fields before adding a new entry
//     if (
//       lastItem.billSlNo === "1" &&
//       (!lastItem.baleQty || lastItem.baleQty === "0")
//     ) {
//       Alert.alert("Error", "Please fill No of Bales before adding a new bill entry.");
//       return;
//     }

//     handleAddBillDetail();
//   }
// };
const handleAddOrUpdateBill = () => {
  if (isEditing) {
    if (editingItem) {
      // Validation when editing an item
      if (editingItem.billSlNo === "1" && (!editingItem.baleQty || Number(editingItem.baleQty) <= 0)) {
        // Alert.alert("Error", "Please fill No of Bales  ");
        showToast( "Please fill No of Bales");
        return;
      }

      updatebillDetail(editingItem);
      setIsEditing(false);

      // Reset form after editing
      setForm((prev) => {
        const updatedBillDetail = [
          ...prev.billDetail,
          {
            slNo: (prev.billDetail.length + 1).toString(),
            billNo: "",
            billid:"",
            billDate: new Date()
              .toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
              .replace(",", "")
              .split(" ")
              .join("-"),
            billSlNo: "",
            itemTag: "",
            itemName: "",
            brandTag: "",
            brandName: "",
            baleQty: "",
            noOfPieces: "",
            rate: "",
            bvalue: "",
            billDueDay: "",
            billduedate: "",
            remarks: "",
          },
        ];
        console.log("Updated Add bill", updatedBillDetail);
        return { ...prev, billDetail: updatedBillDetail };
      });
    }
  } else {
    const lastItem = form.billDetail[form.billDetail.length - 1];

    // Ensure at least one entry exists before adding a new one
    if (!lastItem) {
      // Alert.alert("Error", "Please enter at least one bill entry before adding a new one.");
      showToast("Please enter at least one bill entry before adding a new one.");
      return;
    }

    // Validation for required fields before adding a new entry
    if (lastItem.billSlNo === "1" && (!lastItem.baleQty || Number(lastItem.baleQty) <= 0)) {
      // Alert.alert("Error", "Please fill No of Bales before adding a new bill entry.");
      showToast("Please fill No of Bales before adding a new bill entry.");
      return;
    }

    handleAddBillDetail();
  }
};


const updatebillDetail = (updatedItem: BillDetail) => {
  if (!updatedItem.itemName || !updatedItem.baleQty || !updatedItem.rate) {
    // Alert.alert("Validation Error", "Please fill in all required fields.");
    showToast("Please fill in all required fields.");
    return;
  }

  setForm((prev) => {
    const updatedBillDetail = prev.billDetail.map((bill) =>
      bill.billNo === updatedItem.billNo && bill.billSlNo === updatedItem.billSlNo
        ? { ...bill, ...updatedItem } 
        : bill
    );

    return {
      ...prev,
      billDetail: updatedBillDetail, 
    };
  });
  // Alert.alert("Success", `Bill ${updatedItem.billNo} updated successfully!`);
  showToast(`Bill ${updatedItem.billNo} updated successfully!`);
};


  

  const handleDeleterow = (item: BillDetail) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel' },
        { text: 'Delete', onPress: () => deleteItem(item) },
      ]
    );
  };

  // Function to delete the item from the list
  const deleteItem = (item: BillDetail) => {
    const updatedbillDetail = form.billDetail.filter(
      bill => !(bill.billNo === item.billNo && bill.billSlNo === item.billSlNo)
    );
    setForm({ ...form, billDetail: updatedbillDetail });
    toggleOptions(null);
  };
// console.log(deleteItem);

  const handleSelect = (value: string) => {
    setSelectedValue(value);
    setIsReceiptFormVisible(true);
    setIsFormVisible(true);
    setIsVisible(false);
  
    let selectedType = "";
  
    // Set the type based on the selected value
    if (value === "LR Receipt ") {
      setType(1);
      selectedType = "1";
    } else if (value === "Goods Receipt ") {
      setType(0);
      selectedType = "0";
    } else if (value === "Quotation  ") {
      setType(2);
      selectedType = "2";
    }
  
    // Update the form's Type field
    setForm((prevForm) => ({
      ...prevForm,
      Type: selectedType,
    }));
  };
  

  const handleInputChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

 

// Utility function to calculate the Value
const calculateValue = (rate: string | number, noOfPieces: string | number): string => {
  const numericRate = parseFloat(String(rate || "0"));
  const numericNoOfPieces = parseFloat(String(noOfPieces || "0"));

  if (isNaN(numericRate) || isNaN(numericNoOfPieces)) {
    return "0.00"; 
  }

  return (numericRate * numericNoOfPieces).toFixed(2); 
};


// const handleBillDetailChange = (index: number, field: string, value: string) => {
//   setForm((prev) => {
//     const updatedbillDetail = prev.billDetail.map((bill, i) => {
//       if (i !== index) return bill; // Update only the specific bill

//       const updatedBill = {
//         ...bill,
//         [field]: value, 
//       };

//       // Update `bvalue` dynamically if `rate` or `noOfPieces` changes
//       if (field === "rate" || field === "noOfPieces") {
//         updatedBill.bvalue = calculateValue(
//           parseFloat(updatedBill.rate) || 0,
//           parseFloat(updatedBill.noOfPieces) || 0
//         );
//       }

//       // Set a default billDate if it's not provided
//       if (!updatedBill.billDate) {
//         // updatedBill.billDate = new Date().toISOString().split("T")[0].split("-").reverse().join("-");
//         updatedBill.billDate = new Date().toISOString().split("T")[0]
//       }

//       // Calculate `billduedate` based on `billDueDay` and `billDate`
//       if (field === "billDueDay") {
//         const dueDays = parseInt(value, 10);
//         if (!isNaN(dueDays) && updatedBill.billDate) {
//           const billDate = new Date(updatedBill.billDate);
//           const dueDate = new Date(billDate);
//           dueDate.setDate(billDate.getDate() + dueDays);
//           updatedBill.billduedate = dueDate.toISOString().split("T")[0];
//         } else {
//           updatedBill.billduedate = ""; // Reset if invalid
//         }
//       }

//       // Calculate `billSlNo` dynamically based on `billNo`
//       if (field === "billNo") {
//         // const billNo = parseInt(value, 10);
//         const billNo = value.trim();

//         // if (!isNaN(billNo)) {
//         if(billNo) {
//           let usedBillSlNos: string[] = [];

//           // Find existing billSlNos for the same billNo type
//           usedBillSlNos = prev.billDetail
//             .filter((item, idx) => idx !== index && item.billNo === value)
//             .map((item) => item.billSlNo);

//           let billSlNo = 1;

//           // Handle Type 1 and Type 2 billNo logic
//           while (usedBillSlNos.includes(billSlNo.toString())) {
//             billSlNo++;
//           }

//           updatedBill.billSlNo = billSlNo.toString();
//         } else {
//           updatedBill.billSlNo = ""; 
//         }
//       }

//       return updatedBill;
//     });

//     return { ...prev, billDetail: updatedbillDetail };
//   });

//   // If editing, update `editingItem`
//   if (isEditing && editingItem) {
//     setEditingItem((prevEditingItem) => ({
//       ...prevEditingItem!,
//       [field]: value,
//     }));
//   }

//   if (field === "billNo" || field === "billDueDay" || field === "rate" || field === "noOfPieces") {
//     setTimeout(() => {
//       setEditingItem(null);
//     }, 100); 
//   }
// };
// const handleBillDetailChange = (index: number, field: string, value: string) => {
//   setForm((prev) => {
//     const updatedbillDetail = prev.billDetail.map((bill, i) => {
//       if (i !== index) return bill; // Update only the specific bill

//       const updatedBill = {
//         ...bill,
//         [field]: value,
//       };

//       // Update `bvalue` dynamically if `rate` or `noOfPieces` changes
//       if (field === "rate" || field === "noOfPieces") {
//         updatedBill.bvalue = calculateValue(
//           parseFloat(updatedBill.rate) ,
//           parseFloat(updatedBill.noOfPieces) 
//         );
//       }

//       // Set a default billDate if it's not provided
//       if (!updatedBill.billDate) {
//         updatedBill.billDate = new Date().toISOString().split("T")[0];
//       }

//       // Calculate `billduedate` based on `billDueDay` and `billDate`
//       if (field === "billDueDay") {
//         const dueDays = parseInt(value, 10);
//         if (!isNaN(dueDays) && updatedBill.billDate) {
//           const billDate = new Date(updatedBill.billDate);
//           const dueDate = new Date(billDate);
//           dueDate.setDate(billDate.getDate() + dueDays);
//           updatedBill.billduedate = dueDate.toISOString().split("T")[0];
//         } else {
//           updatedBill.billduedate = ""; 
//         }
//       }

//       // Calculate `billSlNo` dynamically based on `billNo`
//       if (field === "billNo") {
//         const billNo = value.trim();

//         if (billNo) {
//           let usedBillSlNos: string[] = [];

//           // Find existing billSlNos for the same billNo type
//           usedBillSlNos = prev.billDetail
//             .filter((item, idx) => idx !== index && item.billNo === value)
//             .map((item) => item.billSlNo);

//           let billSlNo = 1;

//           // Handle Type 1 and Type 2 billNo logic
//           while (usedBillSlNos.includes(billSlNo.toString())) {
//             billSlNo++;
//           }

//           updatedBill.billSlNo = billSlNo.toString();
//         } else {
//           updatedBill.billSlNo = "";
//         }
//       }

//       return updatedBill;
//     });

//     // If editing, update `editingItem`
//     if (isEditing && editingItem && index === form.billDetail.length - 1) {
//       setEditingItem((prevEditingItem) => ({
//         ...prevEditingItem!,
//         [field]: value,
//       }));
//     }

//     return { ...prev, billDetail: updatedbillDetail };
//   });
// };
const handleBillDetailChange = (index: number, field: keyof BillDetail, value: string) => {
  setForm((prev) => {
    const monthMap: { [key: string]: number } = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
    };

    const updatedbillDetail = prev.billDetail.map((bill, i) => {
      if (i !== index) return bill;

      const updatedBill = { ...bill, [field]: value };

      // Update `bvalue`
      if (field === "rate" || field === "noOfPieces") {
        updatedBill.bvalue = calculateValue(
          parseFloat(updatedBill.rate),
          parseFloat(updatedBill.noOfPieces)
        );
      }

      // Set default `billDate`
      if (!updatedBill.billDate) {
        updatedBill.billDate = new Date().toLocaleString('en-GB', {
          day: '2-digit', month: 'short', year: 'numeric'
        }).replace(',', '').split(' ').join('-');
      }

      // Calculate `billduedate`
      if (field === "billDueDay" || field === "billDate") {
        const dueDays = parseInt(updatedBill.billDueDay, 10);
        const [day, month, year] = updatedBill.billDate.split('-');

        if (!isNaN(dueDays) && month in monthMap) {
          const billDate = new Date(parseInt(year), monthMap[month], parseInt(day));
          if (!isNaN(billDate.getTime())) {
            const dueDate = new Date(billDate);
            dueDate.setDate(billDate.getDate() + dueDays);
            updatedBill.billduedate = dueDate.toLocaleString('en-GB', {
              day: '2-digit', month: 'short', year: 'numeric'
            }).replace(',', '').split(' ').join('-');
          }
        } else {
          updatedBill.billduedate = "";
        }
      }

      // Calculate `billSlNo` dynamically based on `billNo`
      if (field === "billNo") {
        const billNo = value.trim();
        if (billNo) {
          let usedBillSlNos = prev.billDetail
            .filter((item, idx) => idx !== index && item.billNo === value)
            .map((item) => item.billSlNo);
          
          let billSlNo = 1;
          while (usedBillSlNos.includes(billSlNo.toString())) {
            billSlNo++;
          }
          updatedBill.billSlNo = billSlNo.toString();
        } else {
          updatedBill.billSlNo = "";
        }
      }
      
      return updatedBill;
    });

    // Fix: Ensure `monthMap` is available in `editingItem` updates
    if (isEditing && editingItem) {
      const updatedEditingItem = { ...editingItem, [field]: value };

      if (field === "rate" || field === "noOfPieces") {
        updatedEditingItem.bvalue = calculateValue(
          parseFloat(updatedEditingItem.rate),
          parseFloat(updatedEditingItem.noOfPieces)
        );
      }

      if (field === "billDate" || field === "billDueDay") {
        const dueDays = parseInt(updatedEditingItem.billDueDay, 10);
        const [day, month, year] = updatedEditingItem.billDate.split('-');

        if (!isNaN(dueDays) && month in monthMap) {
          const billDate = new Date(parseInt(year), monthMap[month], parseInt(day));
          if (!isNaN(billDate.getTime())) {
            const dueDate = new Date(billDate);
            dueDate.setDate(billDate.getDate() + dueDays);
            updatedEditingItem.billduedate = dueDate.toLocaleString('en-GB', {
              day: '2-digit', month: 'short', year: 'numeric'
            }).replace(',', '').split(' ').join('-');
          }
        }
      }

      setEditingItem(updatedEditingItem);
    }

    return { ...prev, billDetail: updatedbillDetail };
  });
};
const handleReceiptClear = () => {
  Alert.alert(
    'Clear Receipt',
    'Are you sure you want to clear the Receipt?',
    [
      { text: 'Cancel', style: 'cancel' }, 
      {
        text: 'Clear',
        onPress: () => {
          setForm((prev) => ({
            ...prev,
            lrId: "",
            courierNo: "",
            apoNo: "",
            parcelweight: "",
            transporter: "",
            productType: "",
            scanDoc: "",
            lrNo: "",
            type: "",
            shippingFrom: "",
            // date: new Date().toISOString().split("T")[0].split("-").reverse().join("-"),
           date:new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(',', '').split(' ').join('-'),            shippingTo: "",
            supplier: "",
            transCharge: "",
            paymentDate: "",
            otherCharges: "0",
            totalValue: "",
          }));
          setIsReceiptFormVisible(false);
          // Alert.alert("Cleared", "The receipt form has been reset!");
          showToast("The receipt form has been reset!");
        },
      },
    ]
  );
};


const handleBillClear = () => {
  Alert.alert(
    'Clear Bills',
    'Are you sure you want to clear the Bills?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        onPress: () => {
          setForm((prev) => ({
            ...prev,
            billDetail: [
              {
                slNo:'',
                billNo: '',
                billid:"",
                billDate: '',
                billSlNo: '',
                itemTag: '',
                itemName: '',
                brandTag: '',
                brandName: '',
                baleQty: '',
                noOfPieces: '',
                rate: '',
                bvalue: '',
                billDueDay: '',
                billduedate: '',
                remarks: '',
              },
            ],
          }));
          // Alert.alert("Cleared", "All bill details have been cleared!");
          showToast("All bill details have been cleared!");
        },
      },
    ]
  );
};

  
  


// const handleAddBillDetail = () => {
//   const { billNo, itemName, baleQty, rate } =
//     form.billDetail[form.billDetail.length - 1] || {};

//   if (billNo || itemName || baleQty || rate) {
//     setForm((prev) => {
//       const updatedBillDetail = [
//         ...prev.billDetail,
//         {
//           slNo: (prev.billDetail.length + 1).toString(),  
//           billNo: "",
//           // billDate: new Date().toISOString().split("T")[0].split("-").reverse().join("-"),
//           // billDate: new Date().toISOString().split("T")[0],
//           billDate:new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(',', '').split(' ').join('-'),
//           billSlNo: "",
//           itemTag: "",
//           itemName: "",
//           brandTag: "",
//           brandName: "",
//           baleQty: "",
//           noOfPieces: "",
//           rate: "",
//           bvalue: "",
//           billDueDay: "",
//           billduedate: "",
//           remarks: "",
//         },
//       ];

//       return { ...prev, billDetail: updatedBillDetail };
//     });

//     setTimeout(() => {
//       const index = form.billDetail.length;
//       billNoRef.current[index]?.focus();
//     }, 0);
//     setIsBillAdded(true);
//     const alertMessage = isEditing
//   ? `Bill '${billNo}' updated successfully`
//   : `Bill '${billNo}' added successfully`;
// Alert.alert(alertMessage);

//   } else {
//     Alert.alert("Please fill in the current bill details before adding another.");
//   }
// };
// const handleAddBillDetail = () => {
//   const currentItem = form.billDetail[0] || {}; // Only keep one active record
//   const { billNo,  baleQty,  } = currentItem;

//   // Step-by-Step Validation: Ensure the current record is fully completed
 
//     if (!billNo) {
//       Alert.alert("Error", "Bill No is required.");
//       return;
//     }
  
   
  
//     if (!baleQty) {
//       Alert.alert("Error", "No of Bales is required.");
//       return;
//     }
  


//   // Replace the current record with a new empty one
//   setForm((prev) => {
//           const updatedBillDetail = [
//             ...prev.billDetail,
//             {
//               slNo: (prev.billDetail.length + 1).toString(),  
//               billNo: "",
//               // billDate: new Date().toISOString().split("T")[0].split("-").reverse().join("-"),
//               // billDate: new Date().toISOString().split("T")[0],
//               billDate:new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(',', '').split(' ').join('-'),
//               billSlNo: "",
//               itemTag: "",
//               itemName: "",
//               brandTag: "",
//               brandName: "",
//               baleQty: "",
//               noOfPieces: "",
//               rate: "",
//               bvalue: "",
//               billDueDay: "",
//               billduedate: "",
//               remarks: "",
//             },
//           ];
//      console.log('Updated bill', updatebillDetail);
//           return { ...prev, billDetail: updatedBillDetail };
//         });

//   // Focus on the new record's bill number field
//   setTimeout(() => {
//     billNoRef.current[0]?.focus();
//   }, 0);

//   setIsBillAdded(true);

//   // Success Message
//   Alert.alert(`Bill ${currentItem.billNo} saved successfully!`);
// };

const handleAddBillDetail = () => {
  const lastItem = form.billDetail[form.billDetail.length - 1] || {}; // Get the last added record
  const { billNo, baleQty, billSlNo } = lastItem;

  // Step 1: Validate the last entered record before allowing a new one
  if (!billNo) {
    // Alert.alert("Error", "Please fill the Bill No.");
    showToast("Please fill the Bill No.");
    return;
  }

  // Validate baleQty only when billSlNo === "1"
  if (billSlNo === "1" && (!baleQty || Number(baleQty) <= 0)) {
    // Alert.alert("Error", `No of Bales must be greater than 0 for Bill No: ${billNo} (Sl No: ${billSlNo}).`);
    // Alert.alert("Error", `No of Bales must be greater than 0 for Bill No: ${billNo}`);
    showToast(`No of Bales must be greater than 0 for Bill No: ${billNo}`);
    return;
  }

  // Step 2: Add a new empty record only if the previous one is completed
  setForm((prev) => {
    const updatedBillDetail = [
      ...prev.billDetail,
      {
        slNo: (prev.billDetail.length + 1).toString(),
        billNo: "",
        billid:"",
        billDate: new Date()
          .toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
          .replace(",", "")
          .split(" ")
          .join("-"),
        billSlNo: "",
        itemTag: "",
        itemName: "",
        brandTag: "",
        brandName: "",
        baleQty: "",
        noOfPieces: "",
        rate: "",
        bvalue: "",
        billDueDay: "",
        billduedate: "",
        remarks: "",
      },
    ];
    console.log("Updated bill", updatedBillDetail);
    return { ...prev, billDetail: updatedBillDetail };
  });

  // Step 3: Focus on the new record's bill number field
  setTimeout(() => {
    billNoRef.current[0]?.focus();
  }, 0);

  setIsBillAdded(true);

  // Success Message with Record Details
  // Alert.alert(`Bill ${billNo} (Sl No: ${billSlNo || "N/A"}) saved successfully!`);
  // Alert.alert(`Bill ${billNo}  saved successfully!`);
  showToast(`Bill ${billNo}  saved successfully!`);
};




  
  
  const onCalendarPress = (field: string) => {
    setCalendarField(field);
    setCalendarVisible(true);
  };

  const handleDateSelection = (date: { dateString: string }) => {
    if (calendarField) {
      setForm((prev) => ({
        ...prev,
        [calendarField]: date.dateString,
      }));
    }
    setCalendarVisible(false);
  };

  const handleDateSelect = (date: { dateString: string }) => {
    if (calendarField) {
      setForm((prev) => ({
        ...prev,
        billDetail: prev.billDetail.map((bill, i) =>
          i === prev.billDetail.length - 1 ? { ...bill, [calendarField]: date.dateString } : bill
        ),
      }));
    }
    setCalendarVisible(false);
  };

 // Update totalValue whenever billDetail changes
 useEffect(() => {
  const total = calculateTotalValue(form.billDetail);
  setForm((prevState: any) => ({
    ...prevState,
    totalValue: total,
  }));
}, [form.billDetail]);

const calculateTotalValue = (billDetail: BillDetail[]): string => {
  return billDetail
    .reduce((sum, item) => sum + (parseFloat(item.bvalue) || 0), 0)
    .toString();
};

   
  // const handleSave = async () => {
  //   if (isSaving) return;
  //   setIsSaving(true);
  //   try {
  //     // Validate and filter incomplete entries in billDetail
  //     const validatedBillDetails = form.billDetail.filter((item) => {
  //       return (
  //         item.billNo &&
  //         item.billSlNo &&
  //         item.billDate &&
  //         item.itemName &&
  //         item.brandName &&
  //         item.baleQty &&
  //         item.noOfPieces &&
  //         item.rate &&
  //         item.bvalue &&
  //         item.billDueDay &&
  //         item.billduedate
  //       );
  //     });
  
  //     if (validatedBillDetails.length === 0) {
  //       Alert.alert("Error", "Please fill all required fields in the Bill Details.");
  //       return;
  //     }
  
  //     const formToSave = { ...form, billDetail: validatedBillDetails, type: String(type) };

  //     console.log("Form to save:", JSON.stringify(formToSave, null, 2)); // Pretty-print the object
      
  //     const response = await fetch(`${API_URL}/api/LRReceipt/api/V1/Save`, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify(formToSave),
  //     });
  
  //     console.log("Form to be saved:", formToSave);
  
  //     if (response.ok) {
  //       const contentType = response.headers.get("Content-Type");
  
  //       if (contentType && contentType.includes("application/json")) {
  //         const data = await response.json();
  //         Alert.alert("Success", "Data saved successfully!", [{ text: "OK" }]);
  //         console.log("Saved data:", data);
  //       } else {
  //         const textResponse = await response.text();
  //         Alert.alert("Success", textResponse, [{ text: "OK" }]);
  //         console.log("Server response:", textResponse);
  //       }

  //       setForm({
  //         lrId: "",
  //         courierNo: "",
  //         apoNo: "",
  //         parcelweight: "",
  //         transporter: "",
  //         productType: "",
  //         scanDoc: "",
  //         lrNo: "",
  //         type: "",
  //         shippingFrom: "",
  //         // date: new Date().toISOString().split("T")[0].split("-").reverse().join("-"),
  //         date:new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(',', '').split(' ').join('-'),
  //         shippingTo: "",
  //         supplier: "",
  //         transCharge: "",
  //         paymentDate: "",
  //         otherCharges: "",
  //         totalValue: "",
  //         billDetail: [
  //           {
  //             slNo:'',
  //             billNo: "",
  //             billDate: "",
  //             billSlNo: "",
  //             itemTag: "",
  //             itemName: "",
  //             brandTag: "",
  //             brandName: "",
  //             baleQty: "",
  //             noOfPieces: "",
  //             rate: "",
  //             bvalue: "",
  //             billDueDay: "",
  //             billduedate: "",
  //             remarks: "",
  //           },
  //         ],
  //       });
  //       setIsFormVisible(false);
  //       setIsReceiptFormVisible(false);
  //       await  fetchGetDetails();
  //     } else {
  //       const errorMessage = await response.text();
  //       Alert.alert("Error", `Failed to save data. Status: ${response.status} - ${errorMessage}`);
  //     }
  //   } catch (error) {
  //     Alert.alert("Error", "An error occurred while saving data.");
  //     console.error("Error while saving:", error);
  //   } finally {
  //     setIsSaving(false);
  //   }
  // };
//  const handleSave = async () => {
//     if (isSaving) return;
//     setIsSaving(true);
  
//     try {
//       // Collect missing mandatory fields
//       const missingFields = [];
     
//       if (!form.transporter) missingFields.push("Transporter");
//       if (!form.lrNo) missingFields.push("LR No");
//       if (!form.supplier) missingFields.push("Supplier");
//       if (!form.shippingFrom) missingFields.push("Shipping From");
//       if (!form.shippingTo) missingFields.push("Shipping To");
//       // if (!form.otherCharges) missingFields.push("OtherCharges");
  
//       // Validate and filter incomplete entries in billDetail
//       const validatedBillDetails = form.billDetail.filter((item) => {
//         return (
//           item.billNo &&
//           item.billSlNo &&
//           item.billDate &&
//           item.itemName &&
//           item.brandName &&
//           item.baleQty &&
//           item.noOfPieces &&
//           item.rate &&
//           item.bvalue &&
//           item.billDueDay &&
//           item.billduedate
//         );
//       });
  
//       if (validatedBillDetails.length === 0) {
//         missingFields.push("Bill Details (All required fields must be filled)");
//       }
  
//       // If there are missing fields, show error and stop execution
//       if (missingFields.length > 0) {
//         Alert.alert("Error", `Please fill the following fields:\n- ${missingFields.join("\n- ")}`);
//         return;
//       }
  
//       const formToSave = { ...form, billDetail: validatedBillDetails, type: String(type) };
  
//       console.log("Form to save:", JSON.stringify(formToSave, null, 2)); // Pretty-print the object
  
//       const response = await fetch(`${API_URL}/api/LRReceipt/api/V1/Save`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(formToSave),
//       });
  
//       console.log("Form to be saved:", formToSave);
  
//       if (response.ok) {
//         const contentType = response.headers.get("Content-Type");
  
//         if (contentType && contentType.includes("application/json")) {
//           const data = await response.json();
//           Alert.alert("Success", "Data saved successfully!", [{ text: "OK" }]);
//           console.log("Saved data:", data);
//         } else {
//           const textResponse = await response.text();
//           Alert.alert("Success", textResponse, [{ text: "OK" }]);
//           console.log("Server response:", textResponse);
//         }
  
//         setForm({
//           lrId: "",
//           courierNo: "",
//           apoNo: "",
//           parcelweight: "",
//           transporter: "",
//           productType: "",
//           scanDoc: "",
//           lrNo: "",
//           type: "",
//           shippingFrom: "",
//           date: new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(",", "").split(" ").join("-"),
//           shippingTo: "",
//           supplier: "",
//           transCharge: "",
//           paymentDate: "",
//           otherCharges: "",
//           totalValue: "",
//           billDetail: [
//             {
//               slNo: "",
//               billNo: "",
//               billDate: "",
//               billSlNo: "",
//               itemTag: "",
//               itemName: "",
//               brandTag: "",
//               brandName: "",
//               baleQty: "",
//               noOfPieces: "",
//               rate: "",
//               bvalue: "",
//               billDueDay: "",
//               billduedate: "",
//               remarks: "",
//             },
//           ],
//         });
//         setIsFormVisible(false);
//         setIsReceiptFormVisible(false);
//         await fetchGetDetails();
//       } else {
//         const errorMessage = await response.text();
//         // Alert.alert("Error", `Failed to save data. Status: ${response.status} - ${errorMessage}`);
//         Alert.alert("Error", `${errorMessage}`);
//       }
//     } catch (error) {
//       Alert.alert("Error", "An error occurred while saving data.");
//       console.error("Error while saving:", error);
//     } finally {
//       setIsSaving(false);
//     }
//   };
  
// const handleSave = async () => {
//   if (isSaving) return;
//   setIsSaving(true);

//   try {
//     // Step 1: Validate mandatory fields one by one
//     if (!form.transporter) {
//       Alert.alert("Error", "Please fill Transporter.");
//       return;
//     }
//     if (!form.lrNo) {
//       Alert.alert("Error", `Please fill LR/GR No.`);
//       return;
//     }
//     if (!form.supplier) {
//       Alert.alert("Error", "Please fill Supplier.");
//       return;
//     }
//     if (!form.shippingFrom) {
//       Alert.alert("Error", "Please fill Shipping From.");
//       return;
//     }
//     if (!form.shippingTo) {
//       Alert.alert("Error", "Please fill Shipping To.");
//       return;
//     }

//     // Step 2: Filter rows with both billNo and baleQty
//     const validBillDetails = form.billDetail.filter(
//       item => item.billNo && item.baleQty
//     );

//     // Check if there's at least one valid row
//     if (validBillDetails.length === 0) {
//       Alert.alert("Error", "Please fill at least one row with both Bill No. and Bale Qty.");
//       return;
//     }

//     // Step 3: If validation passes, proceed with saving
//     // Create a new form object with only valid bill details
//     const formToSave = { 
//       ...form, 
//       type: String(type),
//       billDetail: validBillDetails
//     };

//     console.log("Form to save:", JSON.stringify(formToSave, null, 2)); // Pretty-print the object

//     const response = await fetch(`${API_URL}/api/LRReceipt/api/V1/Save`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(formToSave),
//     });

//     console.log("Form to be saved:", formToSave);

//     if (response.ok) {
//       const contentType = response.headers.get("Content-Type");

//       if (contentType && contentType.includes("application/json")) {
//         const data = await response.json();
//         Alert.alert("Success", "Data saved successfully!", [{ text: "OK" }]);
//         console.log("Saved data:", data);
//       } else {
//         const textResponse = await response.text();
//         Alert.alert("Success", textResponse, [{ text: "OK" }]);
//         console.log("Server response:", textResponse);
//       }

//       // Reset form after successful save
//       setForm({
//         lrId: "",
//         courierNo: "",
//         apoNo: "",
//         parcelweight: "",
//         transporter: "",
//         productType: "",
//         scanDoc: "",
//         lrNo: "",
//         type: "",
//         shippingFrom: "",
//         date: new Date()
//           .toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
//           .replace(",", "")
//           .split(" ")
//           .join("-"),
//         shippingTo: "",
//         supplier: "",
//         transCharge: "",
//         paymentDate: "",
//         otherCharges: "",
//         totalValue: "",
//         billDetail: [
//           {
//             slNo: "",
//             billNo: "",
//             billDate: "",
//             billSlNo: "",
//             itemTag: "",
//             itemName: "",
//             brandTag: "",
//             brandName: "",
//             baleQty: "",
//             noOfPieces: "",
//             rate: "",
//             bvalue: "",
//             billDueDay: "",
//             billduedate: "",
//             remarks: "",
//           },
//         ],
//       });

//       setIsFormVisible(false);
//       setIsReceiptFormVisible(false);
//       await fetchGetDetails();
//     } else {
//       const errorMessage = await response.text();
//       Alert.alert("Error", `${errorMessage}`);
//     }
//   } catch (error) {
//     Alert.alert("Error", "An error occurred while saving data.");
//     console.error("Error while saving:", error);
//   } finally {
//     setIsSaving(false);
//   }
// };
// const handleSave = async () => {
//   if (isSaving) return;
//   setIsSaving(true);
//   setLoading(true);

//   try {
//     // Step 1: Validate mandatory fields one by one
//     if (!form.transporter) {
//       Alert.alert("Error", "Please fill Transporter.");
//       return;
//     }
//     if (!form.lrNo) {
//       Alert.alert("Error", `Please fill LR/GR No.`);
//       return;
//     }
//     if (!form.supplier) {
//       Alert.alert("Error", "Please fill Supplier.");
//       return;
//     }
//     if (!form.shippingFrom) {
//       Alert.alert("Error", "Please fill Shipping From.");
//       return;
//     }
//     if (!form.shippingTo) {
//       Alert.alert("Error", "Please fill Shipping To.");
//       return;
//     }

//     // Step 2: Check if at least one valid row exists
//     const validBillDetails = form.billDetail.filter(item => item.billNo?.trim());

//     if (validBillDetails.length === 0) {
//       Alert.alert("Error", "Please fill at least one row with both Bill No. and No of Bales.");
//       return;
//     }

//     // Step 2.1: Ensure each billNo has a corresponding baleQty based on billSlNo
//     for (const item of validBillDetails) {
//       if (item.billSlNo === "1" && (!item.baleQty || Number(item.baleQty) <= 0)) {
//         Alert.alert("Error", "Please Fill the No of Bales");
//         return;
//       }
//     }

//     // Show confirmation alert before proceeding
//     Alert.alert(
//       "Confirmation",
//       " Do you want to save the  Record?",
//       [
//         { text: "Cancel", style: "cancel", onPress: () => setIsSaving(false) },
//         {
//           text: "OK",
//           onPress: async () => {
//             try {
//               // Step 3: If validation passes, proceed with saving
//               const formToSave = { 
//                 ...form, 
//                 type: String(type),
//                 billDetail: validBillDetails 
//               };

//               console.log("Form to save:", JSON.stringify(formToSave, null, 2));

//               const response = await fetch(`${API_URL}/api/LRReceipt/api/V1/Save`, {
//                 method: "POST",
//                 headers: {
//                   "Content-Type": "application/json",
//                 },
//                 body: JSON.stringify(formToSave),
//               });

//               console.log("Form to be saved:", formToSave);

//               if (response.ok) {
//                 const contentType = response.headers.get("Content-Type");

//                 if (contentType && contentType.includes("application/json")) {
//                   const data = await response.json();
//                   Alert.alert("Success", "Data saved successfully!", [{ text: "OK" }]);
//                   console.log("Saved data:", data);
//                 } else {
//                   const textResponse = await response.text();
//                   Alert.alert("Success", textResponse, [{ text: "OK" }]);
//                   console.log("Server response:", textResponse);
//                 }

//                 // Reset form after successful save
//                 setForm({
//                   lrId: "",
//                   courierNo: "",
//                   apoNo: "",
//                   parcelweight: "",
//                   transporter: "",
//                   productType: "",
//                   scanDoc: "",
//                   lrNo: "",
//                   type: "",
//                   shippingFrom: "",
//                   date: new Date()
//                     .toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
//                     .replace(",", "")
//                     .split(" ")
//                     .join("-"),
//                   shippingTo: "",
//                   supplier: "",
//                   transCharge: "",
//                   paymentDate: "",
//                   otherCharges: "",
//                   totalValue: "",
//                   billDetail: [
//                     {
//                       slNo: "",
//                       billNo: "",
//                       billDate: "",
//                       billSlNo: "",
//                       itemTag: "",
//                       itemName: "",
//                       brandTag: "",
//                       brandName: "",
//                       baleQty: "",
//                       noOfPieces: "",
//                       rate: "",
//                       bvalue: "",
//                       billDueDay: "",
//                       billduedate: "",
//                       remarks: "",
//                     },
//                   ],
//                 });

//                 setIsFormVisible(false);
//                 setIsReceiptFormVisible(false);
//                 await fetchGetDetails();
//               } else {
//                 const errorMessage = await response.text();
//                 Alert.alert("Error", `${errorMessage}`);
//               }
//             } catch (error) {
//               Alert.alert("Error", "An error occurred while saving data.");
//               console.error("Error while saving:", error);
//             } finally {
//               setIsSaving(false);
//               setLoading(true);
//             }
//           },
//         },
//       ],
//       { cancelable: false }
//     );
//   } catch (error) {
//     Alert.alert("Error", "An error occurred while validating data.");
//     console.error("Validation Error:", error);
//     setIsSaving(false);
//   }
// };


// const handleSave = async () => {
//   console.log("handleSave started, isSaving:", loading);
//   setDisable(true);
//   setIsSaving(true);
//   console.log("isSaving set to true:", isSaving);
//   setError('');

//   try {
//     // 🛑 Validate required fields
//     if (!form.transporter) {
//       Alert.alert('Error', 'Transporter is required');
//       setIsSaving(false);
//       setDisable(false);
//       return;
//     }
//     if (!form.lrNo) {
//       Alert.alert('Error', `${type === 1 ? 'LR No' : type === 0 ? 'GR No' : 'Quotation No'} is required`);
//       setIsSaving(false);
//       setDisable(false);
//       return;
//     }
//     if (!form.supplier) {
//       Alert.alert('Error', 'Supplier is required');
//       setIsSaving(false);
//       setDisable(false);
//       return;
//     }
//     if (!form.shippingFrom) {
//       Alert.alert('Error', 'Shipping From is required');
//       setIsSaving(false);
//       setDisable(false);
//       return;
//     }
//     if (!form.shippingTo) {
//       Alert.alert('Error', 'Shipping To is required');
//       setIsSaving(false);
//       setDisable(false);
//       return;
//     }

//     // if (!form.scanDoc) {
//     //   Alert.alert('Error', 'Please attach LR Copy File');
//     //   setIsSaving(false);
//     //   return;
//     // }

//     // Step 1: Filter valid bill details (with non-empty billNo)
//     const validBillDetails = form.billDetail.filter(item => item.billNo?.trim());

//     if (validBillDetails.length === 0) {
//       Alert.alert("Error", "Please fill at least one row with both Bill No. and No of Bales.");
//       setIsSaving(false);
//       setDisable(false);
//       return;
//     }

//     // Step 2.1: Ensure each billNo has a corresponding baleQty based on billSlNo
//     for (const item of validBillDetails) {
//       if (item.billSlNo === "1" && (!item.baleQty || Number(item.baleQty) <= 0)) {
//         Alert.alert("Error", "Please Fill the No of Bales for Bill ");
//         setIsSaving(false);
//         setDisable(false);
//         return;
//       }
//     }

//     // 🚨 Confirmation Alert: Do you want to save the record?
//     Alert.alert(
//       'Confirmation',
//       'Do you want to save the record?',
//       [
//         { 
//           text: 'Cancel', 
//           style: 'cancel', 
//           onPress: () => {
//             setIsSaving(false);
//             setDisable(false);
//             return; 
//           }
//         },
//         {
//           text: 'OK',
//           onPress: async () => {
//             // 📝 Prepare FormData
//             const formData = new FormData();

//             // 📝 Prepare JSON Payload
//             const lrReceiptJson = {
//               lrId: form.lrId || "",
//               courierNo: form.courierNo || "",
//               apoNo: form.apoNo || "",
//               parcelWeight: form.parcelweight || "",
//               transporter: form.transporter || "",
//               productType: form.productType || "",
//               scanDoc:form.scanDoc,
//               lrNo: form.lrNo || "",
//               type: String(type),
//               shippingFrom: form.shippingFrom || "",
//               date: form.date || "",
//               shippingTo: form.shippingTo || "",
//               supplier: form.supplier || "",
//               transCharge: form.transCharge || "",
//               paymentDate: form.paymentDate || "",
//               otherCharges: form.otherCharges || "",
//               totalValue: form.billDetail
//                 .reduce((sum, item) => sum + (parseFloat(item.bvalue) || 0), 0)
//                 .toString(),
//               billDetail: form.billDetail
//                 .filter(bill => bill.billNo && bill.itemName && bill.baleQty && bill.rate)
//                 .map(bill => ({
//                   slNo: bill.slNo || "",
//                   billNo: bill.billNo || "",
//                   billDate: bill.billDate || "",
//                   billSlNo: bill.billSlNo || "",
//                   itemTag: bill.itemTag || "",
//                   itemName: bill.itemName || "",
//                   brandTag: bill.brandTag || "",
//                   brandName: bill.brandName || "",
//                   baleQty: bill.baleQty || "",
//                   noOfPieces: bill.noOfPieces || "",
//                   rate: bill.rate || "",
//                   bvalue: bill.bvalue || "",
//                   billDueDay: bill.billDueDay || "",
//                   billduedate: bill.billduedate || "",
//                   remarks: bill.remarks || ""
//                 }))
//             };

//             // Append JSON payload as a string
//             formData.append('lrReceiptJson', JSON.stringify(lrReceiptJson));

//             console.log('lrReceiptJsonSave:', JSON.stringify(lrReceiptJson));

//             // 📸 Append Image if Exists
//             if (form.scanDoc) {
//               const fileUri = form.scanDoc;
//               const fileName = fileUri.split('/').pop();
//               const fileType = 'image/png'; // Set proper MIME type based on the image

//               formData.append('scanDoc', {
//                 uri: fileUri,
//                 name: fileName,
//                 type: fileType,
//               });
//             }
//             console.log('formDataSave:', JSON.stringify(formData));
//             // 🔥 Make API Request
//             const response = await axios.post(
//               `${API_URL}/api/LRReceipt/api/V1/Save`,
//               formData,
//               {
//                 headers: {
//                   'Content-Type': 'multipart/form-data',
//                 },
//               }
//             );

//             // 🎉 Success Handling
//             if (response.status >= 200 && response.status < 300) {
//               Alert.alert('Success', response.data, [{ text: 'OK' }]);
//               console.log('Saved data:', response.data);

//               // ✅ Reset Form After Saving
//               setForm({
//                 lrId: "",
//                 courierNo: "",
//                 apoNo: "",
//                 parcelweight: "",
//                 transporter: "",
//                 productType: "",
//                 scanDoc: "",
//                 lrNo: "",
//                 type: String(type),
//                 shippingFrom: "",
//                 date: new Date()
//                   .toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
//                   .replace(",", "")
//                   .split(" ")
//                   .join("-"),
//                 shippingTo: "",
//                 supplier: "",
//                 transCharge: "",
//                 paymentDate: "",
//                 otherCharges: "",
//                 totalValue: "",
//                 billDetail: [
//                   {
//                     slNo: "",
//                     billNo: "",
//                     billDate: "",
//                     billSlNo: "",
//                     itemTag: "",
//                     itemName: "",
//                     brandTag: "",
//                     brandName: "",
//                     baleQty: "",
//                     noOfPieces: "",
//                     rate: "",
//                     bvalue: "",
//                     billDueDay: "",
//                     billduedate: "",
//                     remarks: "",
//                   },
//                 ],
//               });
//               setScanDocUrl(null); 
//             setIsImageSelected(false); 
//             setScanshow(false);
//               setIsReceiptFormVisible(false);
//               setIsFormVisible(false);
//               await fetchGetDetails();
//               setIsBillAdded(false);
//             } else {
//               throw new Error(`Server responded with status: ${response.status}`);
//             }
//           }
//         }
//       ]
//     );
//   } catch (err) {
//     if (err instanceof Error) {
//       console.error('Save error:', err.message);
//     }
//     setError('Failed to save receipt. Please try again.');

//     // Error Alert with response details
//     Alert.alert(
//       'Error',
//       `Failed to save: ${err instanceof Error ? err.message : 'Unknown error'}`
//     );
//   } finally {
//     // Stop saving process
//     // setIsSaving(false);
//     console.log("handleSave completed, resetting isSaving");
//     setIsSaving(false);
//       setDisable(false);
//     console.log("isSaving set to false:", isSaving);
//   }
// };

const handleSave = async () => {
  console.log("handleSave started, isSaving:", isSaving);
  setDisable(true); 
  setIsSaving(true); 
  console.log("isSaving set to true:", isSaving);
  setError('');

  try {
    // 🛑 Validate required fields
    if (!form.transporter?.trim()) {
      showToast('Transporter is required');
      setIsSaving(false); 
      setDisable(false); 
      return;
    }
    if (!form.lrNo?.trim()) {
      showToast( `${type === 1 ? 'LR No' : type === 0 ? 'GR No' : 'Quotation No'} is required`);
      setIsSaving(false); 
      setDisable(false);   
      return;
    }
    if (!form.supplier?.trim()) {
      showToast('Supplier is required');
      setIsSaving(false); 
      setDisable(false);   
      return;
    }
    if (!form.shippingFrom?.trim()) {
      showToast('Shipping From is required');
      setIsSaving(false); 
      setDisable(false);   
      return;
    }
    if (!form.shippingTo?.trim()) {
      showToast('Shipping To is required');
      setIsSaving(false); 
      setDisable(false);   
      return;
    }

    // Step 1: Filter valid bill details (with non-empty billNo)
    const validBillDetails = form.billDetail.filter(item => item.billNo?.trim());
    if (validBillDetails.length === 0) {
      showToast("Please fill at least one row with both Bill No. and No of Bales.");
      setIsSaving(false); 
      setDisable(false); 
      return;
    }

    // Step 2: Ensure each billNo has a corresponding baleQty based on billSlNo
    for (const item of validBillDetails) {
      if (item.billSlNo === "1" && (!item.baleQty || Number(item.baleQty) <= 0)) {
        showToast("Please fill the No of Bales for Bill");
        setIsSaving(false); 
        setDisable(false); 
        return;
      }
    }

    // 🚨 Confirmation Alert: Do you want to save the record?
    await new Promise<void>((resolve, reject) => {
      Alert.alert(
        'Confirmation',
        'Do you want to save the record?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              setIsSaving(false);
              setDisable(false); // Re-enable on cancel
              reject(new Error('Save cancelled'));
            },
          },
          {
            text: 'OK',
            onPress: () => resolve(), // Proceed with save
          },
        ],
        { cancelable: false }
      );
    });

    // 📝 Prepare FormData
    const formData = new FormData();
    const lrReceiptJson = {
      lrId: form.lrId || "",
      courierNo: form.courierNo || "",
      apoNo: form.apoNo || "",
      parcelWeight: form.parcelweight || "",
      transporter: form.transporter || "",
      productType: form.productType || "",
      scanDoc: form.scanDoc || "",
      lrNo: form.lrNo || "",
      type: String(type),
      shippingFrom: form.shippingFrom || "",
      date: form.date || "",
      shippingTo: form.shippingTo || "",
      supplier: form.supplier || "",
      transCharge: form.transCharge || "",
      paymentDate: form.paymentDate || "",
      otherCharges: form.otherCharges || "",
      totalValue: form.billDetail
        .reduce((sum, item) => sum + (parseFloat(item.bvalue) || 0), 0)
        .toString(),
      billDetail: form.billDetail
        .filter(bill => bill.billNo && bill.itemName && bill.baleQty && bill.rate)
        .map(bill => ({
          slNo: bill.slNo || "",
          billNo: bill.billNo || "",
          billid:bill.billid || "0",
          billDate: bill.billDate || "",
          billSlNo: bill.billSlNo || "",
          itemTag: bill.itemTag || "",
          itemName: bill.itemName || "",
          brandTag: bill.brandTag || "",
          brandName: bill.brandName || "",
          baleQty: bill.baleQty || "",
          noOfPieces: bill.noOfPieces || "",
          rate: bill.rate || "",
          bvalue: bill.bvalue || "",
          billDueDay: bill.billDueDay || "",
          billduedate: bill.billduedate || "",
          remarks: bill.remarks || "",
        })),
    };

    formData.append('lrReceiptJson', JSON.stringify(lrReceiptJson));
    console.log('lrReceiptJsonSave:', JSON.stringify(lrReceiptJson));

    // 📸 Append Image if Exists
    if (form.scanDoc) {
      const fileUri = form.scanDoc;
      const fileName = fileUri.split('/').pop();
      const fileType = 'image/png'; // Adjust MIME type as needed
      formData.append('scanDoc', {
        uri: fileUri,
        name: fileName,
        type: fileType,
      });
      console.log('scanDoc appended:', { uri: fileUri, name: fileName, type: fileType });
    }

    // 🔥 Make API Request
    const response = await axios.post(
      `${API_URL}/api/LRReceipt/api/V1/Save`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    // 🎉 Success Handling
       if (response.status >= 200 && response.status < 300) {
         // Show success toast message
         ToastAndroid.show(response.data || 'Data saved successfully', ToastAndroid.SHORT)
         setIsSaving(false);
         setDisable(false);   
       
         // ✅ Reset Form State
         setForm({
           lrId: "",
           courierNo: "",
           apoNo: "",
           parcelweight: "",
           transporter: "",
           productType: "",
           scanDoc: "",
           lrNo: "",
           type: String(type),
           shippingFrom: "",
           date: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
           shippingTo: "",
           supplier: "",
           transCharge: "",
           paymentDate: "",
           otherCharges: "0",
           totalValue: "",
           billDetail: [
             {
               slNo: "",
               billNo: "",
               billid: "",
               billDate: "",
               billSlNo: "",
               itemTag: "",
               itemName: "",
               brandTag: "",
               brandName: "",
               baleQty: "",
               noOfPieces: "",
               rate: "",
               bvalue: "",
               billDueDay: "",
               billduedate: "",
               remarks: "",
             },
           ],
         });
       
         setScanDocUrl(null);
         setIsImageSelected(false);
         setScanshow(false);
         setIsReceiptFormVisible(false);
         setIsFormVisible(false);
         setIsBillAdded(false);
       
         fetchGetDetails();
         
         console.log('Saved data:', response.data);
    } else {
      throw new Error(`Server responded with status: ${response.status}`);
    }
  } catch (err) {
    setError('Failed to save receipt. Please try again.');
    showToast( `Failed to save: ${err instanceof Error ? err.message : 'Unknown error'}`);
    console.log(`Failed to save: ${err instanceof Error ? err.message : 'Unknown error'}`);
    setIsSaving(false);
     setDisable(false);
  }
};

const handleClear = () => {
  Alert.alert(
    "Are you sure?",
    "Do you really want to clear the form?",
    [
      {
        text: "Cancel",
        onPress: () => console.log("Clear canceled"),
        style: "cancel",
      },
      {
        text: "OK",
        onPress: () => {
          setForm(() => ({
            lrId: "",
            courierNo: "",  
            apoNo: "",
            parcelweight: "",
            transporter: "",
            productType: "",
            scanDoc: "",
            lrNo: "",
            type: "",
            shippingFrom: "",
           // date: new Date().toISOString().split("T")[0].split("-").reverse().join("-"),
           date:new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(',', '').split(' ').join('-'),
           shippingTo: "",
            supplier: "",
            transCharge: "",
            paymentDate: "",
            otherCharges: "0",
            totalValue: "",
            billDetail: [
              {
                slNo:'',
                billNo: "",
                billid:"",
                billDate: "",
                billSlNo: "",
                itemTag: "",
                itemName: "",
                brandTag: "",
                brandName: "",
                baleQty: "",
                noOfPieces: "",
                rate: "",
                bvalue: "",
                billDueDay: "",
                billduedate: "",
                remarks: "",
              },
            ],
          }));
          // setScanDocUrl(null); 
          setIsImageSelected(false);
          setIsReceiptFormVisible(false);  
          setScanshow(false);
          showToast("The form has been reset!");
        },
      },
    ],
    { cancelable: false }
  );
  setIsDropdownVisible(false);
   setIsButtonVisible(false);
   setInputValue('');
   fetchGetDetails();
  // setGetDetailsData([]);
};  

//Update the LR Receipt
// const handleUpdate = async () => {
//   if (isSaving) return;
//   setIsSaving(true);

//   try {
//     Alert.alert( "Confirmation", "Do you want to Update this LR/GR Receipt ?",
//       [
//         {
//           text: "Cancel",
//           style: "cancel",
//           onPress: () => setIsSaving(false), 
//         },
//         {
//           text: "Yes",
//           onPress: async () => {
//             const validatedBillDetails = form.billDetail.filter((item) => {
//               return (
//                 item.billNo &&
//                 item.billSlNo &&
//                 item.billDate &&
//                 item.itemName &&
//                 item.brandName &&
//                 item.baleQty &&
//                 item.noOfPieces &&
//                 item.rate &&
//                 item.bvalue &&
//                 item.billDueDay &&
//                 item.billduedate
//               );
//             });

//             if (validatedBillDetails.length === 0) {
//               // Alert.alert("Error", "Please fill all required fields in the Bill Details.");
//               Alert.alert("Error", "Select the LR/GR No for Update.");
//               setIsSaving(false);
//               return;
//             }

//             const formToUpdate = { ...form, billDetail: validatedBillDetails };

//             console.log("Form to update:", JSON.stringify(formToUpdate, null, 2));

//             const response = await fetch(`${API_URL}/api/LRReceipt/api/V1/Update`, {
//               method: "PUT",
//               headers: {
//                 "Content-Type": "application/json",
//               },
//               body: JSON.stringify(formToUpdate),
//             });

//             if (response.ok) {
//               const contentType = response.headers.get("Content-Type");

//               if (contentType && contentType.includes("application/json")) {
//                 const data = await response.json();
//                 Alert.alert("Success", "Data updated successfully!", [{ text: "OK" }]);
//                 console.log("Updated data:", data);
//               } else {
//                 const textResponse = await response.text();
//                 Alert.alert("Success", textResponse, [{ text: "OK" }]);
//                 console.log("Server response:", textResponse);
//               }

//               setForm({
//                 lrId: "",
//                 courierNo: "",
//                 apoNo: "",
//                 parcelweight: "",
//                 transporter: "",
//                 productType: "",
//                 scanDoc: "",
//                 lrNo: "",
//                 type: "",
//                 shippingFrom: "",
//                // date: new Date().toISOString().split("T")[0].split("-").reverse().join("-"),
//                date:new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(',', '').split(' ').join('-'),
//                shippingTo: "",
//                 supplier: "",
//                 transCharge: "",
//                 paymentDate: "",
//                 otherCharges: "",
//                 totalValue: "",
//                 billDetail: [
//                   {
//                     slNo: '',
//                     billNo: "",
//                     billDate: "",
//                     billSlNo: "",
//                     itemTag: "",
//                     itemName: "",
//                     brandTag: "",
//                     brandName: "",
//                     baleQty: "",
//                     noOfPieces: "",
//                     rate: "",
//                     bvalue: "",
//                     billDueDay: "",
//                     billduedate: "",
//                     remarks: "",
//                   },
//                 ],
//               });

//               setIsFormVisible(false);
//               setIsDropdownVisible(false);
//               setIsReceiptFormVisible(false);
//               await fetchGetDetails();
//             } else {
//               const errorMessage = await response.text();
//               Alert.alert("Error", `${errorMessage}`);
//               console.log("Error", `${errorMessage}`);
//             }
//           },
//         },
//       ],
//       { cancelable: false }
//     );
//   } catch (error) {
//     Alert.alert("Error", "An error occurred while updating data.");
//     console.error("Error while updating:", error);
//     setIsSaving(false);
//   }
// };
// const handleUpdate = async () => {
//   if (isSaving) return;
//   setIsSaving(true);
//   setError('');

//   try {
//     //  Validate required fields
//     if (!form.transporter) {
//       Alert.alert('Error', 'Transporter is required');
//       setIsSaving(false);
//       return;
//     }
//     if (!form.lrNo) {
//       Alert.alert('Error', `${type === 1 ? 'LR No' : type === 0 ? 'GR No' : 'Quotation No'} is required`);
//       setIsSaving(false);
//       return;
//     }
//     if (!form.supplier) {
//       Alert.alert('Error', 'Supplier is required');
//       setIsSaving(false);
//       return;
//     }
//     if (!form.shippingFrom) {
//       Alert.alert('Error', 'Shipping From is required');
//       setIsSaving(false);
//       return;
//     }
//     if (!form.shippingTo) {
//       Alert.alert('Error', 'Shipping To is required');
//       setIsSaving(false);
//       return;
//     }

//     // Step 1: Filter valid bill details (with non-empty billNo)
//     const validBillDetails = form.billDetail.filter(item => item.billNo?.trim());

//     if (validBillDetails.length === 0) {
//       Alert.alert("Error", "Please fill at least one row with both Bill No. and No of Bales.");
//       setIsSaving(false);
//       return;
//     }

//     // Step 2: Ensure each billNo has a corresponding baleQty based on billSlNo
//     for (const item of validBillDetails) {
//       if (item.billSlNo === "1" && (!item.baleQty || Number(item.baleQty) <= 0)) {
//         Alert.alert("Error", "Please Fill the No of Bales for Bill");
//         setIsSaving(false);
//         return;
//       }
//     }


//     Alert.alert(
//       'Confirmation',
//       'Do you want to update this LR/GR Receipt?',
//       [
//         {
//           text: 'Cancel',
//           style: 'cancel',
//           onPress: () => {
//             setIsSaving(false);
//             return;
//           }
//         },
//         {
//           text: 'OK',
//           onPress: async () => {
//             try {
 
//               const formData = new FormData();

//               //  Prepare JSON Payload
//               const lrReceiptJson = {
//                 lrId: form.lrId || "",
//                 courierNo: form.courierNo || "",
//                 apoNo: form.apoNo || "",
//                 parcelWeight: form.parcelweight || "",
//                 transporter: form.transporter || "",
//                 productType: form.productType || "",
//                 lrNo: form.lrNo || "",
//                 type: String(type),
//                 shippingFrom: form.shippingFrom || "",
//                 date: form.date || "",
//                 shippingTo: form.shippingTo || "",
//                 supplier: form.supplier || "",
//                 transCharge: form.transCharge || "",
//                 paymentDate: form.paymentDate || "",
//                 otherCharges: form.otherCharges || "",
//                 totalValue: form.billDetail
//                   .reduce((sum, item) => sum + (parseFloat(item.bvalue) || 0), 0)
//                   .toString(),
//                 billDetail: form.billDetail
//                   .filter(bill => bill.billNo && bill.itemName && bill.baleQty && bill.rate)
//                   .map(bill => ({
//                     slNo: bill.slNo || "",
//                     billNo: bill.billNo || "",
//                     billDate: bill.billDate || "",
//                     billSlNo: bill.billSlNo || "",
//                     itemTag: bill.itemTag || "",
//                     itemName: bill.itemName || "",
//                     brandTag: bill.brandTag || "",
//                     brandName: bill.brandName || "",
//                     baleQty: bill.baleQty || "",
//                     noOfPieces: bill.noOfPieces || "",
//                     rate: bill.rate || "",
//                     bvalue: bill.bvalue || "",
//                     billDueDay: bill.billDueDay || "",
//                     billduedate: bill.billduedate || "",
//                     remarks: bill.remarks || ""
//                   }))
//               };

//               // Append JSON payload as a string
//               formData.append('lrReceiptJson', JSON.stringify(lrReceiptJson));

//               console.log('lrReceiptJson:', JSON.stringify(lrReceiptJson));

//               // 📸 Append Image if Exists
//               if (form.scanDoc) {
//                 const fileUri = form.scanDoc;
//                 if (fileUri.startsWith('C:\\') || fileUri.includes(':\\')) {
//                   const fileName = fileUri.split('\\').pop();
//                   formData.append('scanDoc', null);
//                 } else {
//                   const fileName = fileUri.split('/').pop();
//                   const fileType = 'image/png'; 
            
//                   formData.append('scanDoc', {
//                     uri: fileUri,
//                     name: fileName,
//                     type: fileType,
//                   });
//                 }
//               }
//               console.log('formData:', JSON.stringify(formData));

//               const response = await axios.put(
//                 `${API_URL}/api/LRReceipt/api/V1/Update`,
//                 formData,
//                 {
//                   headers: {
//                     'Content-Type': 'multipart/form-data',
//                   },
//                 }
//               );

//               // 🎉 Success Handling
//               if (response.status >= 200 && response.status < 300) {
//                 Alert.alert('Success', response.data, [{ text: 'OK' }]);
//                 console.log('Updated data:', response.data);

//                 //  Reset Form After Updating
//                 setForm({
//                   lrId: "",
//                   courierNo: "",
//                   apoNo: "",
//                   parcelweight: "",
//                   transporter: "",
//                   productType: "",
//                   scanDoc: "",
//                   lrNo: "",
//                   type: String(type),
//                   shippingFrom: "",
//                   date: new Date()
//                     .toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
//                     .replace(",", "")
//                     .split(" ")
//                     .join("-"),
//                   shippingTo: "",
//                   supplier: "",
//                   transCharge: "",
//                   paymentDate: "",
//                   otherCharges: "",
//                   totalValue: "",
//                   billDetail: [
//                     {
//                       slNo: "",
//                       billNo: "",
//                       billDate: "",
//                       billSlNo: "",
//                       itemTag: "",
//                       itemName: "",
//                       brandTag: "",
//                       brandName: "",
//                       baleQty: "",
//                       noOfPieces: "",
//                       rate: "",
//                       bvalue: "",
//                       billDueDay: "",
//                       billduedate: "",
//                       remarks: "",
//                     },
//                   ],
//                 });

//                 setIsReceiptFormVisible(false);
//                 setIsFormVisible(false);
//                 setIsDropdownVisible(true);
//                 setIsButtonVisible(true);
//                 setInputValue('');
//                 await fetchGetDetails();
//               } else if (response.status === 400) {
//                 const errorMessage = response.data?.message || "Bad Request: Invalid input";
//                 Alert.alert("Error", errorMessage); 
//                 // throw new Error(errorMessage);
//               } else {
//                 throw new Error(`Server responded with status: ${response.status}`);
//               }
//             } catch (err) {
//               if (axios.isAxiosError(err) && err.response?.status === 400) {
//                 console.log('Update error:', err.response.data);
//                 setError(err.response.data?.message || 'Bad Request: Invalid input');
//                 Alert.alert('Error', err.response.data);
//               } else if (err instanceof Error) {
//                 console.error('Update error:', err.message);
//                 setError('Failed to update receipt. Please try again.');
//                 Alert.alert('Error', `Failed to update: ${err.message}`);
//               } else {
//                 setError('An unknown error occurred.');
//                 Alert.alert('Error', 'An unknown error occurred. Please try again.');
//               }
//             } finally {
//               setIsSaving(false);
//             }
//           }
//         }
//       ],
//       { cancelable: false }
//     );
//    } catch (err: unknown) {
//       if (axios.isAxiosError(err) && err.response?.status === 400) {
//         console.error('Update error:', err.response.data);
//         setError(err.response.data?.message || 'Bad Request: Invalid input');
//         Alert.alert('Error', err.response.data);
//       } else if (err instanceof Error) {
//         console.error('Update error:', err.message);
//         setError(err.message || 'Failed to update receipt. Please try again.');
//         Alert.alert('Error', `Failed to update: ${err.message}`);
//       } else {
//         console.error('Unknown error:', err);
//         setError('An unknown error occurred.');
//         Alert.alert('Error', 'An unknown error occurred. Please try again.');
//       }
    
    
//   } finally {
//     setIsSaving(false);
//   }
// };
const handleUpdate = async () => {
  if (isSaving) return; // Prevent multiple clicks

  // Validate required fields before showing the alert
  if (!form.transporter) {
    showToast('Transporter is required');
    return;
  }
  if (!form.lrNo) {
    showToast(`${type === 1 ? 'LR No' : type === 0 ? 'GR No' : 'Quotation No'} is required`);
    return;
  }
  if (!form.supplier) {
    showToast('Supplier is required');
    return;
  }
  if (!form.shippingFrom) {
    showToast('Shipping From is required');
    return;
  }
  if (!form.shippingTo) {
    showToast('Shipping To is required');
    return;
  }

  // Step 1: Filter valid bill details (with non-empty billNo)
  const validBillDetails = form.billDetail.filter(item => item.billNo?.trim());
  if (validBillDetails.length === 0) {
    showToast("Please fill at least one row with both Bill No. and No of Bales.");
    return;
  }

  // Step 2: Ensure each billNo has a corresponding baleQty based on billSlNo
  for (const item of validBillDetails) {
    if (item.billSlNo === "1" && (!item.baleQty || Number(item.baleQty) <= 0)) {
      showToast("Please Fill the No of Bales for Bill");
      return;
    }
  }

  // Show confirmation alert
  Alert.alert(
    'Confirmation',
    'Do you want to update this LR/GR Receipt?',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'OK',
        onPress: async () => {
          setIsSaving(true); // Set saving state when OK is clicked
          setDisable(true);  // Disable button immediately
          setError('');      // Clear any previous errors

          try {
            const formData = new FormData();

            // Prepare JSON Payload
            const lrReceiptJson = {
              lrId: form.lrId || "",
              courierNo: form.courierNo || "",
              apoNo: form.apoNo || "",
              parcelWeight: form.parcelweight || "",
              transporter: form.transporter || "",
              productType: form.productType || "",
              scanDoc: form.scanDoc || "",
              lrNo: form.lrNo || "",
              type: String(type),
              shippingFrom: form.shippingFrom || "",
              date: form.date || "",
              shippingTo: form.shippingTo || "",
              supplier: form.supplier || "",
              transCharge: form.transCharge || "",
              paymentDate: form.paymentDate || "",
              otherCharges: form.otherCharges || "",
              totalValue: form.billDetail
                .reduce((sum, item) => sum + (parseFloat(item.bvalue) || 0), 0)
                .toString(),
              billDetail: form.billDetail
                .filter(bill => bill.billNo && bill.itemName && bill.baleQty && bill.rate)
                .map(bill => ({
                  slNo: bill.slNo || "",
                  billNo: bill.billNo || "",
                  billid: bill.billid || "",
                  billDate: bill.billDate || "",
                  billSlNo: bill.billSlNo || "",
                  itemTag: bill.itemTag || "",
                  itemName: bill.itemName || "",
                  brandTag: bill.brandTag || "",
                  brandName: bill.brandName || "",
                  baleQty: bill.baleQty || "",
                  noOfPieces: bill.noOfPieces || "",
                  rate: bill.rate || "",
                  bvalue: bill.bvalue || "",
                  billDueDay: bill.billDueDay || "",
                  billduedate: bill.billduedate || "",
                  remarks: bill.remarks || ""
                }))
            };

            // Append JSON payload as a string
            formData.append('lrReceiptJson', JSON.stringify(lrReceiptJson));
            console.log('lrReceiptJson:', JSON.stringify(lrReceiptJson));

            // Append Image if Exists
            if (form.scanDoc) {
              const fileUri = form.scanDoc;
              if (fileUri.startsWith('C:\\') || fileUri.includes(':\\')) {
                const fileName = fileUri.split('\\').pop();
                formData.append('scanDoc', null);
              } else {
                const fileName = fileUri.split('/').pop();
                const fileType = 'image/png';
                formData.append('scanDoc', {
                  uri: fileUri,
                  name: fileName,
                  type: fileType,
                });
              }
            }
            console.log('formData:', JSON.stringify(formData));

            const response = await axios.put(
              `${API_URL}/api/LRReceipt/api/V1/Update`,
              formData,
              {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              }
            );

            // Success Handling
            if (response.status >= 200 && response.status < 300) {
              // Alert.alert('Success', response.data, [
              //   {
              //     text: 'OK',
              //     onPress: () => {
              //       setDisable(false); // Re-enable after success
              //     }
              //   }
              // ]);
              showToast(response.data);
              setDisable(false);
              console.log('Updated data:', response.data);

              // Reset Form After Updating
              setForm({
                lrId: "",
                courierNo: "",
                apoNo: "",
                parcelweight: "",
                transporter: "",
                productType: "",
                scanDoc: "",
                lrNo: "",
                type: String(type),
                shippingFrom: "",
                date: new Date()
                  .toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                  .replace(",", "")
                  .split(" ")
                  .join("-"),
                shippingTo: "",
                supplier: "",
                transCharge: "",
                paymentDate: "",
                otherCharges: "0",
                totalValue: "",
                billDetail: [
                  {
                    slNo: "",
                    billNo: "",
                    billid:"",
                    billDate: "",
                    billSlNo: "",
                    itemTag: "",
                    itemName: "",
                    brandTag: "",
                    brandName: "",
                    baleQty: "",
                    noOfPieces: "",
                    rate: "",
                    bvalue: "",
                    billDueDay: "",
                    billduedate: "",
                    remarks: "",
                  },
                ],
              });
              setScanDocUrl(null);
              setIsImageSelected(false);
              setScanshow(false);
              setIsReceiptFormVisible(false);
              setIsFormVisible(false);
              setIsBillAdded(false);
              setIsDropdownVisible(false);
              setIsButtonVisible(false);
              setInputValue('');
              await fetchGetDetails();
            } else if (response.status === 400) {
              const errorMessage = response.data?.message || "Bad Request: Invalid input";
              // Alert.alert("Failed To Update", errorMessage);
              showToast(errorMessage);
            } else {
              throw new Error(`Server responded with status: ${response.status}`);
            }
          } catch (err) {
            if (axios.isAxiosError(err) && err.response?.status === 400) {
              console.log('Failed To Update', err.response.data);
              setError(err.response.data?.message || 'Bad Request: Invalid input');
              // Alert.alert('Failed To Update', err.response.data);
              showToast(`Failed to Update${err.response.data}`);
            } else if (err instanceof Error) {
              console.error('Update error:', err.message);
              setError('Failed to update receipt. Please try again.');
              // Alert.alert('Failed To Update', `Failed to update: ${err.message}`);
              showToast(`Failed to update: ${err.message}`);
            } else {
              setError('An unknown error occurred.');
              // Alert.alert('Error', 'An unknown error occurred. Please try again.');
              showToast(`Failed to update: An unknown error occurred. Please try again.`)
            }
          } finally {
            setIsSaving(false); // Reset saving state
            setDisable(false);  // Re-enable button
          }
        },
      },
    ],
    { cancelable: false }
  );
};

// Delete the LR Receipt
const handleDelete = async () => {
  setLoading(true);
  if (!form.lrId) {
    // Alert.alert("Error", "No LR ID found to delete.");
    showToast("No LR ID found to delete.");
    return;
  }

  Alert.alert(
    "Confirm Deletion",
    "Are you sure you want to delete this LR/GR Receipt?",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setIsDeleting(true);
          try {
            const response = await fetch(
              `${API_URL}/api/LRReceipt/api/V1/Delete?LRId=${form.lrId}`,
              {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
              }
            );

            if (response.ok) {
              // Alert.alert("Success", "LR Receipt deleted successfully!");
              showToast( "LR Receipt deleted successfully!")
              console.log("Deleted LR Receipt ID:", form.lrId);
              
              // Reset form state
              setForm({
                lrId: "",
                courierNo: "",
                apoNo: "",
                parcelweight: "",
                transporter: "",
                productType: "",
                scanDoc: "",
                lrNo: "",
                type: "",
                shippingFrom: "",
               // date: new Date().toISOString().split("T")[0].split("-").reverse().join("-"),
               date:new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(',', '').split(' ').join('-'),
               shippingTo: "",
                supplier: "",
                transCharge: "",
                paymentDate: "",
                otherCharges: "0",
                totalValue: "",
                billDetail: [],
              });
              
              setIsFormVisible(false);
              setIsReceiptFormVisible(false);
              await fetchGetDetails(); // Refresh the data
            } else {
              const errorMessage = await response.text();
              // Alert.alert(
              //   "Failed to Delete",
              //   // `Failed to delete LR Receipt. Status: ${response.status} - ${errorMessage}`
              //  `${errorMessage}`
              // );
              showToast(`"Failed to Delete"${errorMessage}`);
            }
          } catch (error) {
            showToast("An error occurred while deleting the LR Receipt.");
            console.error("Error while deleting:", error);
          } finally {
            setIsDeleting(false);
            setLoading(false);
          }
        },
      },
    ]
  );
};



const handleIconPress = () => {
  setModalVisible(true); 
};

// const handleBack = () => {
//   // navigation.goBack(); 
//   onBack();
// };
const handleBack = () => {
  onBack(); // Call the onBack function passed from MainFile
};

  console.log(API_URL);
  console.log(getDetailsData)



useEffect(() => {
  console.log('API URL updated to:', API_URL);
}, [API_URL]); 

useEffect(() => {
  const updateOrientation = () => {
    const { width, height } = Dimensions.get('window');
    setOrientation(width > height ? 'landscape' : 'portrait');
  };

  updateOrientation(); 

  const subscription = Dimensions.addEventListener('change', updateOrientation);

  return () => subscription.remove(); 
}, []);
  const { width, height } = Dimensions.get('window');
  const watermarkStyle = {
    position: 'absolute' as const,
    width: orientation === 'portrait' ? width * 0.8 : width * 0.3,
    height: orientation === 'portrait' ? height * 0.85 : height * 0.5,
    top: orientation === 'portrait' ? height * 0.20 : height * 0.60,
    left: orientation === 'portrait' ? width * 0.23 : width * 0.75,
    transform: [{ translateX: -50 }, { translateY: -50 }],
  };

  return (
    <View style={styles.settingcontainer}>
      {/* <View style={styles.loadingcontainer}>
  {loading && <ActivityIndicator size="large" color="#007AFF" />} */}
      {loading &&  isSaving && (
        <View style={styles.spinnerContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        </View>
        )}

        {/* <Image 
          source={retailcliq} 
          // style={styles.watermark} 
          style={watermarkStyle}
          resizeMode="contain" 
        /> */}
          <Image source={retailcliq} style={watermarkStyle} resizeMode="contain" />
  <TouchableOpacity onPress={handleIconPress} style={styles.icon}>
  {/* <Image
    source={icon}
    style={{ width: 30, height: 30 }} 
  /> */}
  
  

</TouchableOpacity>


      <UrlModal 
      isModalVisible={isModalVisible} 
      setModalVisible={setModalVisible} 
      />

    <KeyboardAvoidingView 
    //  behavior={Platform.OS === 'ios' ? 'padding' : 'height'} // Adjust behavior based on platform
    //  style={{ flex: 1 }} // Ensure it takes the full screen
     >

      <ScrollView
      //  contentContainerStyle={{ flexGrow: 1 }} // Ensure the ScrollView expands
      //  keyboardShouldPersistTaps="handled" // Handle taps outside the keyboard
      >
    
        <Text style={styles.header}>Incoming Logistics Short</Text>
        {/* <TouchableOpacity onPress={onBack} style={styles.backButton}> */}
              {/* <Text style={styles.backButtonText}>← Back</Text> */}
              {/* <Text style={styles.backButtonText}>← </Text> */}
            {/* </TouchableOpacity> */}
        <View style={styles.container}>

      {/* Touchable Dropdown */}
      <TouchableOpacity
  style={styles.dropdown }
  onPress={() => setIsVisible(true)}
>
  <Text style={[styles.selectedText, { color: '#000' }]}>
    {selectedValue ? (
      <>
        {selectedValue}
        <Text style={[styles.arrow, { color: '#333' }]}> ▼</Text>
      </>
    ) : (
      " Select an option"
    )}
  </Text>
</TouchableOpacity>

      {/* Modal Dropdown */}
      
      <Modal
        transparent={true}
        visible={isVisible}
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}>
           <TouchableWithoutFeedback onPress={() => setIsVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentheader}>
            <FlatList
              data={options}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => handleSelect(item)}>
                  <Text style={styles.optionitemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            
          </View>
        </View>
        </TouchableWithoutFeedback>
      </Modal>
      
    </View>
    {isDropdownVisible && (
  <Dropdown<DetailData>
    // style={styles.dropdowndata}
    style={[styles.dropdowndata, { backgroundColor: '#fff' }]} // White background
    selectedTextStyle={{ color: '#000' }} // Black selected text
    itemTextStyle={{color:"#000"}}
    placeholderStyle={{ color: '#000' }} // Black placeholder text
    data={getDetailsData}
    search
    searchPlaceholder="Enter LRNo..."
    labelField="label"
    valueField="value"
    placeholder="Select an option"
    value={inputValue}
    onChange={(item: DetailData) => {
      setInputValue(item.value.toString()); 
      // setType(Number(item.value));      
      setIsReceiptFormVisible(true);
      setIsFormVisible(true);    
    }}
  />
)}
    {/* </View>
  );
}; */}

    <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setIsReceiptFormVisible((prevState) => !prevState)}
      >
        <Text style={styles.toggleButtonText}>
          {isReceiptFormVisible ? (
          <>
           {selectedValue}Details
            <Text style={styles.arrow}> ▲</Text>
          </>
        ) : (
          <>
            {selectedValue}Details
            <Text style={styles.arrow}> ▼</Text>
          </>
        )}
        </Text>
      </TouchableOpacity>

      {/* {loading && <Text>Loading form...</Text>} */}
{ isReceiptFormVisible && (
  <View style={styles.receiptFormContainer}>
    <Text style={styles.receiptFormTitle}>Receipt Details</Text>

    <CustomInput
      label="Courier No"
      value={form.courierNo}
      onChangeText={(value) => handleInputChange('courierNo', value)}
      style={styles.inputField}
      dropdownData={courierdata}
    //   required={true}
    //   error={form.courierNo ? null : 'Courier No is required'}
    />
    <CustomInput
      label="Transporter"
      value={form.transporter}
      onChangeText={(value) => handleInputChange('transporter', value)}
      style={styles.inputField}
      dropdownData={transportdata}
      required={true}
      error={!form.transporter ?  'Transporter is required' : null }
     
    />

   {/* Conditional fields based on type */}
   {type === 1 && (
        <CustomInput
          label="LR No"
          value={form.lrNo}
          onChangeText={(value) => handleInputChange('lrNo', value)}
          style={styles.inputField}
          required={true}
          error={!form.lrNo ? 'LR No is required' : null}
        />
      )}
      {type === 0 && (
        <CustomInput
          label="GR No"
          value={form.lrNo}
          onChangeText={(value) => handleInputChange('lrNo', value)}
          style={styles.inputField}
          required={true}
          error={!form.lrNo ? 'GR No is required' : null}
        />
      )}
      {type === 2 && (
        <CustomInput
          label="Quotation No"
          value={form.lrNo}
          onChangeText={(value) => handleInputChange('lrNo', value)}
          style={styles.inputField}
          required={true}
          error={!form.lrNo ? 'Quotation No is required' : null}
        />
      )}

    <CustomInput
      label="LR Date"
      value={form.date}
      placeholder="YYYY-MM-DD"
      onChangeText={(value) => handleInputChange('date', value)}
      showCalendar={true}
      onFocus={() => onCalendarPress('date')} 
      onCalendarPress={() => onCalendarPress('date')}
      style={styles.inputField}
    />
    {/* {fieldVisible && ( */}
    <CustomInput
      label="Supplier"
      value={form.supplier}
      onChangeText={(value) => handleInputChange('supplier', value)}
      style={styles.inputField}
      dropdownData={supplierdata}
      required={true}
      error={!form.supplier ? "Supplier  is required" : null}
    />
     {/* )} */}
    {fieldVisible && (
    <CustomInput
      label="Payment Date"
      value={form.paymentDate}
      onChangeText={(value) => handleInputChange('paymentDate', value)}
      showCalendar={true}
      onFocus={() => onCalendarPress('paymentDate')} 
      onCalendarPress={() => onCalendarPress('paymentDate')}
      style={styles.inputField}
    />
      )}
    {fieldVisible && (
    <CustomInput
      label="A.P.O.NO"
      value={form.apoNo}
      onChangeText={(value) => handleInputChange('apoNo', value)}
      style={styles.inputField}
    />
    )}
    {fieldVisible && (
    <CustomInput
      label="Product Type"
      value={form.productType}
      onChangeText={(value) => handleInputChange('productType', value)}
      style={styles.inputField}
      dropdownData={productdata}
      // required={true}
      // error={!form.productType ? "Product type is required" : null}
    />
    )}
    <CustomInput
      label="Shipping From"
      value={form.shippingFrom}
      onChangeText={(value) => handleInputChange('shippingFrom', value)}
      style={styles.inputField}
      dropdownData={shippingdata}
      required={true}
      error={!form.shippingFrom ? "Shipping From is required" : null}
    />
    <CustomInput
      label="Shipping To"
      value={form.shippingTo}
      onChangeText={(value) => handleInputChange('shippingTo', value)}
      style={styles.inputField}
      dropdownData={shippingdata}
      required={true}
      error={!form.shippingTo ?  "Shipping To is required" : null}
    />
    <CustomInput
      label="Trans Charges"
      keyboardType="numeric"
      value={form.transCharge}
      onChangeText={(value) => handleInputChange('transCharge', value)}
      style={styles.inputField}
    />
    {fieldVisible && (
    <CustomInput
      label="Other Charges"
      //  keyboardType="numeric"
      value={form.otherCharges }
      onChangeText={(value) => handleInputChange('otherCharges', value)}
      style={styles.inputField}
       keyboardType="numeric"
    />
    )}
     {fieldVisible && (
    <CustomInput
      label="Parcel Weight"
      value={form.parcelweight}
      onChangeText={(value) => handleInputChange('parcelweight', value)}
      style={styles.inputField}
    />
     )}
    <CustomInput
    //   label="Scan Doc"
      label="LR Copy"
      value={form.scanDoc}
      onChangeText={(value) => handleInputChange('scanDoc', value)}
      style={styles.inputField}
     // required={true}
      editable={false} 
     // error={!form.scanDoc ? "LR copy is required" : null}
    />
   {/* <Camera 
     onImageSelected={(uri: string) => handleInputChange('scanDoc', uri)} 
      /> */}
      {!isImageSelected && (
  <Camera 
    onImageSelected={handleImageSelected} 
  />
)}
  {scanDocUrl && scanshow && (
  <View>
    <Image 
      source={{ uri: scanDocUrl }} 
      style={{ width: 200, height: 200, resizeMode: "contain" }} 
    />
    <TouchableOpacity onPress={handleClearImage} style={styles.clearImageButton}>
      <Text style={styles.clearImageButtonText}>Clear Image</Text>
    </TouchableOpacity>
  </View>
)}


    <TouchableOpacity
      style={styles.clearButton}  
      onPress={handleReceiptClear}
    >
    <Text style={styles.clearButtonText}>Clear Receipt</Text>
    </TouchableOpacity>
    
  </View>
)}


        <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => {
          setIsFormVisible((prevState) => !prevState); 
          setIsReceiptFormVisible(false);  
        }}
      >
        <Text style={styles.toggleButtonText}>
          {isFormVisible ? (
          <>
            Bill Details
            <Text style={styles.arrow}> ▲</Text>
          </>
        ) : (
          <>
            Bill Details
            <Text style={styles.arrow}> ▼</Text>
          </>
        )}
        </Text>
      </TouchableOpacity>
      {isFormVisible && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill Details</Text>

          <View style={styles.tableContainer}>
  <ScrollView horizontal={true}>
    <View style={styles.table}>
      {/* Table Header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.headerCell, styles.firstCell]}></Text>
        <Text style={[styles.headerCell, styles.smallCell]}>SlNo</Text>
        <Text style={[styles.headerCell, styles.mediumCell]}>Bill No</Text>
        <Text style={[styles.headerCell, styles.smallCell]}>BillSlNo</Text>
        <Text style={[styles.headerCell, styles.mediumCell]}>Bill Date</Text>
        <Text style={[styles.headerCell, styles.largeCell]}>Item Name</Text>
        <Text style={[styles.headerCell, styles.mediumCell]}>Brand Name</Text>
        <Text style={[styles.headerCell, styles.smallCell]}>Bale Qty</Text>
        <Text style={[styles.headerCell, styles.smallCell]}>No.Of Pcs</Text>
        <Text style={[styles.headerCell, styles.smallCell]}>Rate</Text>
        <Text style={[styles.headerCell, styles.smallCell]}>Value</Text>
        <Text style={[styles.headerCell, styles.smallCell]}>DueDays</Text>
        {/* <Text style={[styles.headerCell, styles.mediumCell]}>DueDate</Text> */}
        <Text style={[styles.headerCell, styles.mediumCell]}>Remarks</Text>
      </View>

      {/* Table Body */}
      {isBillAdded && (
      <FlatList
        data={form.billDetail
          .filter((item, index) => {
            // item.slNo = (index + 1).toString(); 
            return item.billNo && item.billSlNo && item.billDate && item.itemName;
          })
          // .sort((a, b) => Number(a.billNo) - Number(b.billNo))
          .sort((a, b) =>  Number(a.billid) - Number(b.billid))
        }
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <View
            style={[
              styles.tableRow,
              index % 1 === 0 ? styles.evenRow : styles.oddRow,
              // item.selected &&
               styles.selectedRow,
            ]}
          >
            {/* <TouchableOpacity onPress={() => toggleOptions(index)}> */}
              {/* <Text style={[styles.cell, styles.smallCell]}>
                {visibleOptions === index ? '▲' : '▼'}
              </Text> */}
            {/* </TouchableOpacity> */}
            {/* {visibleOptions === index && (
              <View style={styles.optionsContainer}>
                <TouchableOpacity onPress={() => handleDeleterow(item)}>
                  <Text style={styles.optionText}>Delete</Text>
                </TouchableOpacity>
              </View>
            )} */}
             <TouchableOpacity  style={[styles.cell, styles.firstCell]} onPress={() => handleBillEdit(item)}>
              {/* <Text style={[styles.cell, styles.smallCell, styles.optionText]}>Edit</Text> */}
            <Text style={[styles.optionText]}>
                                 <Icon name="edit" size={20} color="#fff" />
                                 </Text>
            </TouchableOpacity>

            {/* Table cells */}
          {/*   <Text style={[styles.cell, styles.smallCell]}>{item.slNo}</Text> */}
            <Text style={[styles.cell, styles.smallCell , {color:'#333'}]}>{index + 1}</Text>  
            <Text style={[styles.cell, styles.mediumCell , {color:'#333'}]}>{item.billNo}</Text>
            <Text style={[styles.cell, styles.smallCell , {color:'#333'}]}>{item.billSlNo}</Text>
            <Text style={[styles.cell, styles.mediumCell, {color:'#333'}]}>{item.billDate}</Text>
            <Text style={[styles.cell, styles.largeCell, {color:'#333'}]}>
              {getLabelFromValue(itemdata, item.itemName).label}
            </Text>
            <Text style={[styles.cell, styles.mediumCell, {color:'#333'}]}>
              {getLabelFromValue(branddata, item.brandName).label}
            </Text>
            <Text style={[styles.cell, styles.smallCell, {color:'#333'}]}>{item.baleQty}</Text>
            <Text style={[styles.cell, styles.smallCell, {color:'#333'}]}>{item.noOfPieces}</Text>
            <Text style={[styles.cell, styles.smallCell, {color:'#333'}]}>{item.rate}</Text>
            <Text style={[styles.cell, styles.smallCell, {color:'#333'}]}>{item.bvalue}</Text>
            <Text style={[styles.cell, styles.smallCell, {color:'#333'}]}>{item.billDueDay}</Text>
            {/* <Text style={[styles.cell, styles.mediumCell]}>{item.billduedate}</Text> */}
            <Text style={[styles.cell, styles.mediumCell, {color:'#333'}]}>{item.remarks}</Text>
            {/* <TouchableOpacity onPress={() => handleBillEdit(item)}>
              <Text style={[styles.cell, styles.smallCell, styles.optionText]}>Edit</Text>
            </TouchableOpacity> */}
            <TouchableOpacity   onPress={() => handleDeleterow(item)}>
                {/* <Text style={[styles.cell, styles.smallCell,styles.optiondeleteText]}>Delete</Text> */}
                  <Text style={[styles.optiondeleteText]} >
                                            <Icon name="delete" size={20} color="#fff" />
                                            </Text>
              </TouchableOpacity>
          </View>
          
        )}
      />
      )}
    </View>
  </ScrollView>


  {/* Table Footer */}
  <View style={styles.tableFooter}>
        <View style={styles.footerRow}>
          <Text style={[styles.footerText, styles.smallCell, {color:'#333'}]}> Total BaleQty:</Text>
          <TextInput
            style={[styles.footerInput, styles.smallCell, {color:'#333'}]}
            editable={false}
            value={form.billDetail
              .reduce((sum, item) => sum + (parseFloat(item.baleQty) || 0), 0)
              .toString()}
          />
        </View>
        {fieldVisible && (
        <View style={styles.footerRow}>
          <Text style={[styles.footerText, styles.smallCell, {color:'#333'}]}>Total Value:</Text>
          <TextInput
            style={[styles.footerInput, styles.smallCell, {color:'#333'}]}
            editable={false}
            value={form.totalValue}
            />
        </View>
        )}
      </View>
</View>


        {form.billDetail.length > 0 && (
         <View style={styles.billRow}>
      <View style={styles.billInputRow}>
      <Text style={styles.billInputLabel}>
        Bill No {<Text style={styles.required}>*</Text>} 
      </Text>
       {!form.billDetail[form.billDetail.length - 1].billNo && (
        <Text style={{ color: "red" }}>BillNo is required</Text>
      )} 
      <TextInput
        style={styles.input}
        ref={(el) => {
          if (el) {
            const currentIndex = form.billDetail.length - 1;
            billNoRef.current[currentIndex] = el;
          }
        }}
        keyboardType="default"
        placeholder="Enter Bill No"
        // value={form.billDetail[form.billDetail.length - 1].billNo}
        value={currentItem?.billNo || ""}
        // editable={!isEditing} 
        editable={!isShowMode && !isEditing}
        onChangeText={(value) =>
          handleBillDetailChange(form.billDetail.length - 1, "billNo", value)
        }
      />
    </View>
    {fieldVisible && (
         <View style={styles.billInputRow}>
           <Text style={styles.billInputLabel}>Bill Date { <Text style={styles.required}>*</Text>}</Text>
           <View style={styles.calrow}>
             <TextInput
               style={[styles.input, { flex: 2 }]}
               placeholder="DD-MM-YYYY"
              //  value={form.billDetail[form.billDetail.length - 1].billDate || new Date().toISOString().split("T")[0].split("-").reverse().join("-")} 
              value={currentItem?.billDate} 
               onChangeText={(value) =>
                 handleBillDetailChange(form.billDetail.length - 1, "billDate", value)
               }
             />
             <TouchableOpacity
               style={styles.calendarButton}
               onPress={() => onCalendarPress("billDate")}
             >
               <Text style={styles.calendar}>📅</Text>
             </TouchableOpacity>
           </View>
         </View>
    )}
   {fieldVisible && (
         <View style={styles.billInputRow}>
      <Text style={styles.billInputLabel}>
        Bill Serial No  {/*{<Text style={styles.required}>*</Text>} */}
      </Text>
      {/* {!form.billDetail[form.billDetail.length - 1].billSlNo && (
        <Text style={{ color: "red" }}>BillSlNo is required</Text>
      )} */}
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="Enter Bill Serial No"
        // value={form.billDetail[form.billDetail.length - 1].billSlNo}
        value={currentItem?.billSlNo} 
        editable={false} 
      />
    </View>
   )}
     {fieldVisible && (
      <View style={styles.billInputRow}>
 

  <CustomInput
    label="Item Name"
    value={currentItem?.itemTag || ''}
    placeholder="Select Item Name"
    placeholdercolor = '#808080'
    dropdownData={itemdata} // Pass the dropdown data
    onChangeText={(value) => {
      const selectedItem = itemdata.find((item) => item.value === value);
      handleBillDetailChange(form.billDetail.length - 1, 'itemName', selectedItem?.label || '');
      handleBillDetailChange(form.billDetail.length - 1, 'itemTag', value);
    }}
    required
  />
</View>

     )}
       {fieldVisible && (

 
<View style={styles.billInputRow}>
{/* <Text style={styles.billInputLabel}>Brand Name</Text> */}

<CustomInput
  label="Brand Name"
  value={currentItem?.brandTag || ''}
  placeholder="Enter Brand Name"
  placeholdercolor = '#808080'
  dropdownData={branddata} // Pass the dropdown data
  onChangeText={(value) => {
    const selectedItem = branddata.find((item) => item.value === value);
    handleBillDetailChange(form.billDetail.length - 1, 'brandName', selectedItem?.label || '');
    handleBillDetailChange(form.billDetail.length - 1, 'brandTag', value);
  }}
  required
/>
</View>

       )}
   {/* {fieldVisible && ( */}
   <View style={styles.billInputRow}>
  <Text style={styles.billInputLabel}>
    No.of Bales { <Text style={styles.required}>*</Text>}
    </Text>
    {!form.billDetail[form.billDetail.length - 1].baleQty && (
                 <Text style={{ color: 'red' }}>No of Bales is required</Text>
            )}
  <TextInput
    style={[
      styles.input,
      currentItem?.billSlNo === "1" ? {} : { backgroundColor: "#e0e0e0" },
    ]}
    keyboardType="numeric"
    placeholder="Enter Bale Quantity"
    // value={
    //   currentItem?.billSlNo === "1"
    //     ? currentItem?.baleQty !== "0"
    //       ? currentItem?.baleQty
    //       : "" // If baleQty is "0", show empty
    //     : "0" // Non-editable state: Show "0" if not "1"
    // }
    value={
      currentItem?.billSlNo === "1" 
        ? currentItem?.baleQty !== "0" 
          ? currentItem?.baleQty 
          : ""  // If baleQty is "0", show empty
        : form.billDetail[form.billDetail.length - 1].baleQty = "0"  // Non-editable state: Show "0" if not "1"
    }
    editable={currentItem?.billSlNo === "1"}
    // onChangeText={(value) => {
    //   if (currentItem) {
    //     handleBillDetailChange(form.billDetail.indexOf(currentItem), "baleQty", value);
    //   }
    // }}
     onChangeText={(value) => {
    if (isEditing && editingItem) {
      setEditingItem({ ...editingItem, baleQty: value });
    } else if (currentItem) {
      handleBillDetailChange(form.billDetail.indexOf(currentItem), "baleQty", value);
    }
  }}
  // In the onChangeText for baleQty:
// onChangeText={(value) => {
//   if (isEditing && editingItem) {
//     setEditingItem({ ...editingItem, baleQty: value, bvalue: value }); // Update both fields
//   } else if (currentItem) {
//     // Update both baleQty and bvalue
//     const index = form.billDetail.indexOf(currentItem);
//     handleBillDetailChange(index, "baleQty", value);
//     handleBillDetailChange(index, "bvalue", value);
//   }
// }}
  />
</View>
   {/* )} */}
     {fieldVisible && (
 
         <View style={styles.billInputRow}>
           <Text style={styles.billInputLabel}>NoofPieces {/*{ <Text style={styles.required}>*</Text>} */}
           </Text>
           {/* {!form.billDetail[form.billDetail.length - 1].noOfPieces && (
                 <Text style={{ color: 'red' }}>NoofPieces is required</Text>
            )} */}
          <TextInput
             style={styles.input}
             keyboardType="numeric"
             placeholder="Enter No of Pieces"
            //  value={form.billDetail[form.billDetail.length - 1].noOfPieces}
            value={currentItem?.noOfPieces} 
             onChangeText={(value) =>
               handleBillDetailChange(form.billDetail.length - 1, "noOfPieces", value)
             }
           />
         </View>
     )}
       {fieldVisible && (
 
         <View style={styles.billInputRow}>
           <Text style={styles.billInputLabel}>Rate  {/*{ <Text style={styles.required}>*</Text>}*/}
           </Text>
           {/* {!form.billDetail[form.billDetail.length - 1].rate && (
                 <Text style={{ color: 'red' }}>Rate is required</Text>
            )} */}
           <TextInput
             style={styles.input}
             keyboardType="numeric"
             placeholder="Enter Rate"
            //  value={form.billDetail[form.billDetail.length - 1].rate}
            value={currentItem?.rate} 
             onChangeText={(value) =>
               handleBillDetailChange(form.billDetail.length - 1, "rate", value)
             }
           />
         </View>
       )}
         {fieldVisible && (
 
         <View style={styles.billInputRow}>
           <Text style={styles.billInputLabel}>Value  {/* { <Text style={styles.required}>*</Text>}*/}
           </Text>
           {/* {!form.billDetail[form.billDetail.length - 1].bvalue && (
                 <Text style={{ color: 'red' }}>Value is required</Text>
            )} */}
           <TextInput
             style={styles.input}
             keyboardType="numeric"
             placeholder="Enter Value"
             editable={false}
            //  value={form.billDetail[form.billDetail.length - 1].bvalue}
            value={currentItem?.bvalue} 
             onChangeText={(value) =>
               handleBillDetailChange(form.billDetail.length - 1, "bvalue", value)
             }
           />
         </View>
         )}
           {fieldVisible && (
 
         <View style={styles.billInputRow}>
           <Text style={styles.billInputLabel}>Bill Due Days</Text>
           <TextInput
             style={styles.input}
             keyboardType="phone-pad"
             placeholder="Enter Bill Due Days"
            //  value={form.billDetail[form.billDetail.length - 1].billDueDay}
            value={currentItem?.billDueDay} 
             onChangeText={(value) =>
               handleBillDetailChange(form.billDetail.length - 1, "billDueDay", value)
             }
           />
         </View>
           )}
             {fieldVisible && (
 
         <View style={styles.billInputRow}>
           <Text style={styles.billInputLabel}>Bill Due Date</Text>
           <View style={styles.calrow}>
             <TextInput
               style={styles.input}
               placeholder="YYYY-MM-DD"
               editable={false}
               value={form.billDetail[form.billDetail.length - 1].billduedate}
              // value={currentItem?.billduedate} 
               onChangeText={(value) =>
                 handleBillDetailChange(form.billDetail.length - 1, "billduedate", value)
               }
             />
          
           </View>
         </View>
             )}
            {fieldVisible && (
 
         <View style={styles.billInputRow}>
            <Text style={styles.billInputLabel}>Remarks</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Remarks"
              // value={form.billDetail[form.billDetail.length - 1].remarks}
              value={currentItem?.remarks} 
              onChangeText={(value) =>
                handleBillDetailChange(form.billDetail.length - 1, 'remarks', value)
              }
            />
          </View>
               )}


          
        <TouchableOpacity style={styles.addBillButton} onPress={handleAddOrUpdateBill}>
        <Text style={styles.addBillButtonText}>
          {isEditing ? 'Update Bill' : 'Add Bill'}
        </Text>
      </TouchableOpacity>
          <TouchableOpacity style={styles.clearButton} onPress={handleBillClear}>
            <Text style={styles.clearButtonText}> Clear Bill</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
      )}
     <View style={styles.buttonContainer}>
        {isButtonVisible ? (
          <>
           <TouchableOpacity
        style={[styles.button, isSaving ? styles.buttonSaving : null]} // Gray out when saving
        onPress={handleUpdate}
        disabled={isSaving} // Disable button while updating
      >
        <Text style={[styles.buttonText, isSaving ? styles.buttonTextSaving : null]}>
          {isSaving ? 'Updating' : 'Update'}
        </Text>
      </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={handleDelete} >
              <Text style={styles.buttonText}>Delete</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* <TouchableOpacity style={styles.button} onPress={handleSave}  
            disabled={isSaving}
            >
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity> */}
             <TouchableOpacity
  style={[styles.button, isSaving ? styles.buttonSaving : null]} // Apply gray style when saving
  onPress={handleSave}
  disabled={isSaving} // Disable button while saving
>
  <Text style={[styles.buttonText, isSaving ? styles.buttonTextSaving : null]}>
    {isSaving ? "Saving" : "Save"}
  </Text>
</TouchableOpacity>
          </>
        )}

        {/* <TouchableOpacity style={styles.getbyidbutton} onPress={handleshow} >
        
          <Text style={styles.getbyidbuttonText}>
            {isDropdownVisible ? 'Hide' : 'Show'}
          </Text>
        </TouchableOpacity> */}
<TouchableOpacity
  style={[
    styles.getbyidbutton,
    !!inputValue && isDropdownVisible ? styles.buttonDisabled : null // Apply disabled style when inputValue exists and dropdown is visible
  ]}
  onPress={handleshow}
  disabled={!!inputValue && isDropdownVisible} // Explicitly convert to boolean
>
  <Text style={[
    styles.getbyidbuttonText,
    !!inputValue && isDropdownVisible ? styles.buttonTextDisabled : null
  ]}>
    {isDropdownVisible ? 'Hide' : 'Show'}
  </Text>
</TouchableOpacity>
        <TouchableOpacity style={styles.button}  onPress={handleClear}>
          <Text style={styles.buttonText}>Clear</Text>
        </TouchableOpacity>
      </View>
      
      </ScrollView>

      {isCalendarVisible && (
        <Modal
          transparent={true}
          animationType="fade"
          visible={isCalendarVisible}
          onRequestClose={() => setCalendarVisible(false)}
        >
          <View style={styles.modalView}>
            <Calendar
              onDayPress={(date: { dateString: string; }) => {
                handleDateSelect(date);
                handleDateSelection(date);
              }}
              markedDates={{
                [(form[calendarField] as string)]: { selected: true, selectedColor: "blue" }
              }}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setCalendarVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      )}
       {/* Spinner for ALL API calls */}
            {loading && getByIDdata &&(
              <View style={styles.spinnerContainer}>
                <ActivityIndicator size="large" color="#007BFF" />
                {/* <Text style={styles.spinnerText}>Loading...</Text> */}
                <Text style={styles.spinnerText}></Text>
              </View>
            )}
             {isSaving &&(
              <View style={styles.spinnerContainer}>
                <ActivityIndicator size="large" color="#007BFF" />
                {/* <Text style={styles.spinnerText}>Loading...</Text> */}
                <Text style={styles.spinnerText}></Text>
              </View>
            )}
    </KeyboardAvoidingView>
    {/* </View> */}
    {/* {loading && <ActivityIndicator size="large" color="#3498db" />} */}
    {/* {loading && isSaving} */}
{/* {error && (
  <View style={styles.errorContainer}>
    <Text style={styles.errorMessage}>{error}</Text>
  </View>
)} */}
    </View>
    //  {loading}
  );
};

const CustomInput: React.FC<{
  label: string;
  error?: string | null;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  placeholdercolor?: string;
  keyboardType?: KeyboardTypeOptions;
  showSearch?: boolean;
  onSearch?: () => void;
  showCalendar?: boolean;
  onCalendarPress?: () => void;
  style?: ViewStyle;
  dropdownData?: Array<{ label: string; value: string }>;
  required?: boolean;
  onFocus?: () => void;
  editable?: boolean;
}> = ({
  label,
  error,
  value,
  onChangeText,
  placeholder = '',
  placeholdercolor = '#000',
  keyboardType = 'default',
  showSearch,
  onSearch,
  showCalendar,
  onCalendarPress,
  dropdownData,
  required,
  onFocus,
  editable = true,
}) => {
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isDropdown = dropdownData && dropdownData.length > 0;

  // Enhanced filter function for more accurate search
  const filteredData = dropdownData
    ? dropdownData
        .filter((item) => {
          const labelLower = item.label.toLowerCase();
          const queryLower = searchQuery.toLowerCase().trim();

          if (!queryLower) return true; 

          const queryWords = queryLower.split(/\s+/);
          return queryWords.every((word) => labelLower.includes(word));
        })
        .sort((a, b) => {
          const aLower = a.label.toLowerCase();
          const bLower = b.label.toLowerCase();
          const queryLower = searchQuery.toLowerCase();

          if (aLower === queryLower) return -1;
          if (bLower === queryLower) return 1;
          if (aLower.startsWith(queryLower)) return -1;
          if (bLower.startsWith(queryLower)) return 1;
          return aLower.localeCompare(bLower);
        })
    : [];


  const closeDropdown = () => {
    setIsDropdownVisible(false);
    setSearchQuery(''); 
  };

  return (
    <View style={[styles.recieptcontainer]}>
      <Text style={styles.label}>
        {label} : {required && <Text style={styles.required}>*</Text>}
      </Text>
      {error && <Text style={styles.error}>{error}</Text>}
      <View style={styles.inputWrapper}>
        {isDropdown ? (
          <>
            <TouchableOpacity
              style={[styles.recieptdropdown, styles.flexInput]}
              onPress={() => setIsDropdownVisible(true)}
              disabled={!editable}
            >
              {/* <Text style={[styles.selectedText, { color: value ? undefined : placeholdercolor }]}> */}
                <Text style={[styles.selectedText, { color: value ? '#333' : '#D3D3D3' }]}>
                {value
                  ? dropdownData.find((item) => item.value === value)?.label || placeholder
                  : placeholder}
              </Text>
              <Text style={styles.chevrondown}>▼</Text>
            </TouchableOpacity>

            {/* Dropdown Modal */}
            <Modal
              transparent
              visible={isDropdownVisible}
              onRequestClose={closeDropdown} 
            >
              <TouchableWithoutFeedback onPress={closeDropdown}>
                <View style={styles.modalOverlay}>
                  <TouchableWithoutFeedback>
                    <View style={styles.modalContent}>
                      {/* Search Input */}
                      <TextInput
                        style={styles.searchInput}
                        placeholder="Search..."
                        placeholderTextColor={placeholdercolor}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        editable={editable}
                      />

                      {/* Dropdown List */}
                      <FlatList
                        data={filteredData}
                        keyExtractor={(item) => item.value}
                        renderItem={({ item }) => (
                          <TouchableOpacity
                            style={styles.option}
                            onPress={() => {
                              onChangeText(item.value);
                              closeDropdown(); 
                            }}
                          >
                         <Text style={{ color: '#333' }}>{item.label}</Text>
                          </TouchableOpacity>
                        )}
                      />
                    </View>
                  </TouchableWithoutFeedback>
                </View>
              </TouchableWithoutFeedback>
            </Modal>
          </>
        ) : (
          <TextInput
            style={[styles.input, styles.flexInput]}
            value={value}
            onFocus={onFocus}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={placeholdercolor}
            keyboardType={keyboardType}
            editable={editable}
          />
        )}

        {showCalendar && (
          <TouchableOpacity
            style={styles.calendarButton}
            onPress={onCalendarPress}
          >
            <Text style={styles.calendar}>📅</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: "#fff",
    paddingTop: 20,
    justifyContent: 'center',
    alignItems: 'center',
    maxHeight:"auto",
    height:"auto",
  },
  recieptcontainer:{
    marginBottom: 20,
    // backgroundColor: "#fff",
  },

  header: {
    fontSize: 24,
    color:'white',
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 20,
    // textDecorationLine: 'underline'
    alignItems: 'center',
    // marginVertical: 15,
    width: '100%',
    // backgroundColor: '#3949AB',
    backgroundColor: '#4CAF50',
    padding: 10,
    // alignItems: 'center',
    marginBottom: 20,
  },
  settingcontainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    width: '100%',
    position: 'relative', 
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
  icon: {
    position: 'absolute',
    top: 10,
    right: 20, 
    zIndex: 1,
  },
  back:{
    position: 'absolute',
    top: 10,
    left: 20, 
    zIndex: 1,
  },
  retailicon: {
    position: 'absolute',
    top: 10,
    left: 20, 
    zIndex: 1,
  },
 watermark: {
    position: 'absolute',
    width: '80%', // ✅ Keep as a string since percentages are supported
    height: '85%', // ✅ Same
    top: '60%', // ✅ Should be a number if using absolute positioning
    left: '23%',
    opacity: 0.5,
    transform: [{ translateX: -50 }, { translateY: -50 }], // ✅ Correct transform format
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
    backgroundColor:'#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  label: {
    width: 150,
    // width:120,
    fontSize: 16,
    color: "#333",
  },
  // input: {
  //   flex: 1,
  //   height: 40,
  //   borderColor: "#ccc",
  //   borderWidth: 1,
  //   borderRadius: 4,
  //   paddingLeft: 10,
  //   fontSize: 16,
  //   color: "#333",
  // },
  settinginput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 4,
    paddingLeft: 10,
    marginBottom: 10,
  },
  searchButton: {
    paddingHorizontal: 10,
  },
  searchButtonText: {
    fontSize: 20,
  },
  // calendarButton: {
  //   paddingLeft: 10,
  // },
  calendar: {
    fontSize: 20,
    color: "#333",
  },
  // table: {
  //   marginTop: 20,
  //   borderRadius: 4,
  //   overflow: "scroll",
  //     borderWidth: 1,
  //   borderColor: '#ccc',

  // },
  // tableHeader: {
  //   flexDirection: "row",
  //   backgroundColor: "#2980B9",
  //   paddingVertical: 5,
  //   alignItems: "center",
    
    
  //   paddingHorizontal: 10,
  
  //   borderBottomWidth: 1,
  //   borderColor: '#ccc',
  // },
  tableHeaderText: {
    flex: 1,
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
    padding: 5,
    fontSize: 12,
  },
  // tableRow: {
  //   flexDirection: "row",
  //   paddingVertical: 10,
  //   backgroundColor: "#ecf0f1",
  //   borderBottomWidth: 1,
  //   borderBottomColor: "#ccc",
  //   padding: 10,         // Add padding for space within the cell
  //   marginRight: 10,     // Add margin for space between cells horizontally
  //   borderColor: '#ddd',
  //   paddingHorizontal: 10,
  // },
  tableCell: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    color: "#333",
    padding: 10,        
    marginRight: 10,     
    // borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    borderRightWidth: 1,
    borderColor: '#ddd',
  },
  billRow: {
    marginVertical: 20,
  },
  billInputRow: {
    marginBottom: 12,
  },
  billInputLabel: {
    fontSize: 16,
    marginBottom: 6,
    color: "#333",
  },
  addBillButton: {
    backgroundColor: "#27ae60",
    paddingVertical: 12,
    borderRadius: 5,
    marginVertical: 20,
  },
  addBillButtonText: {
    textAlign: "center",
    color: "#fff",
    fontSize: 18,
  },
  modalView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  closeButton: {
    backgroundColor: "#e74c3c",
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 20,
    borderRadius: 5,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 18,
  },
  errorContainer: {
    padding: 10,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderRadius: 5,
    marginTop: 10,
    alignSelf: 'center',
  },
  errorMessage: {
    color: 'red',
    fontSize: 16,
    fontWeight: 'bold',
  },
  inputContainer: {
    // flexDirection: 'row',  
    // alignItems: 'center',  
  },
  calrow:{
    flexDirection: 'row',
    alignItems: 'center', 
    padding: 10,
  },
  tableContainer: {
    marginTop: 10,
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
  },
  
  table: {
    width: '100%',
  },
  
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2196F3',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  
  headerCell: {
    padding: 10,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#ccc',
  },
  
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  
  cell: {
    padding: 10,
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#ccc',
    color:"#000",
  },
  
  // Cell width variations

  firstCell:{
    width: 70,
    // color:"#000",
  },
  smallCell: {
    width: 90,
    // color:"#000",
  },
  
  mediumCell: {
    width: 120,
    // color:"#000",
  },
  
  largeCell: {
    width: 200,
    // color:"#000",
  },
  
  // Row styling
  evenRow: {
    backgroundColor: '#ffffff',
  },
  
  oddRow: {
    backgroundColor: '#f0f8ff', // Light blue for alternate rows
  },
  
  selectedRow: {
    backgroundColor: '#ffffff', // Highlight color for selected row
  },
  tableFooter: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderTopWidth: 1,
    borderColor: '#ccc',
  },
  footerCell: {
    padding: 10,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    color:'#000',
    width: '95%',
    alignItems: 'center', 
    marginBottom: 15,
    maxHeight:"auto",
    height:"auto",
  },
  backButton: {
    position: 'absolute',
    top: 20, // Adjust as needed
    right: 10, // Position at the top-right
    width: 45, // Maintain circular shape
    height: 45, 
    borderRadius: 22.5, // Fully circular
    backgroundColor: 'lightgray', // Background color
    justifyContent: 'center', // Center horizontally
    alignItems: 'center', // Center vertically
    elevation: 5, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  
  backButtonText: {
    color: '#000', 
    fontSize: 25, // Adjust size to fit
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 26, // Moves text slightly up
    marginLeft: 3,  // Moves text slightly to the right
  },
  
  
  dropdowndata:{
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    width: '95%',
    // alignItems: 'center', 
    alignSelf:'center',
    marginBottom: 15,
    color:'#000'
  },
  recieptdropdown:{
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    // width: '95%',
    // alignItems: 'center', 
    marginBottom: 15,
  },
  selectedText: {
    fontSize: 16,
    color: '#000',
    fontWeight: 'bold',
  },
  chevrondown:{
    fontSize: 13, // Smaller size
    position: 'absolute',
    right: 8, // Adjusted to be near the right end
    top: '70%',
    transform: [{ translateY: -6 }], // Fine-tuned to center properly
    color:'#333'
  },
  arrow: {
    fontSize: 11, 
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContentheader: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    elevation: 5,
  },
  modalContent: {
    width: '80%',
    height:'50%',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    elevation: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
  },
  option: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  optionitemText:{
    fontSize: 16,
    color:'#333'
  },
  optionText: {
    color: '#333',
    backgroundColor: 'lightgreen',
    fontWeight: 'bold',
    fontSize: 14, // Reduced font size
    textAlign: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#ccc',
    paddingVertical: 6, // Reduced padding
    paddingHorizontal: 6, // Reduced padding
    borderRadius: 8, // Slightly smaller round edges
    width: 40, // Fixed width to ensure consistency
    height: 40, 
},
//   optionText: {
//     color: '#333',
//     backgroundColor:'lightgreen',
//     fontWeight: 'bold',
//     fontSize: 16,
//     textAlign: 'center',
//     justifyContent: 'center',
//     borderRightWidth: 1,
//     borderRightColor: '#ccc',
//     paddingVertical: 10, // Adjust padding for height
//     paddingHorizontal: 20, // Adjust padding for width
//     borderRadius: 10, // Round edges
// },

// optiondeleteText: {
//     // color: '#000',
//     color: '#fff',
//     // color:'#ff4d4d',
//     backgroundColor: '#ff4d4d',
//     // backgroundColor:'red',
//     // backgroundColor:'red',
//     fontWeight: 'bold',
//     fontSize: 12,
//     textAlign: 'center',
//     borderRightWidth: 1,
//     borderRightColor: '#ccc',
//     paddingVertical: 10, // Adjust padding for height
//     paddingHorizontal: 10, // Adjust padding for width
//     borderRadius: 10, // Round edges
// },
optiondeleteText: {
  color: '#fff', // White text for contrast
  backgroundColor: '#ff4d4d', // Red background
  fontWeight: 'bold',
  fontSize: 12,
  textAlign: 'center',
  justifyContent: 'center',
  borderRightWidth: 1,
  borderRightColor: '#ccc',
  paddingVertical: 6, // Reduced padding
  paddingHorizontal: 6, // Reduced padding
  borderRadius: 8, // Slightly smaller round edges
  width: 40, // Fixed width to ensure consistency
  height: 40, 
},

  // toggleButton: {
  //   padding: 10,
  //   backgroundColor: '#007BFF',
  //   borderRadius: 5,
  //   marginBottom: 20,
  //   alignSelf: 'flex-start', 
  // },
  // toggleButtonText: {
  //   color: 'white',
  //   fontWeight: 'bold',
  // },
  inputField: {
       flex: 1,
    backgroundColor: "#fff",
    paddingTop: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  
  receiptFormContainer: {
    padding: 20,
    backgroundColor: '#f8f8f8', 
    borderRadius: 8,
    marginTop: 20,
  },
  receiptFormTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333', 
    maxHeight:"auto",
    height:"auto",
  },
  toggleButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  toggleButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 160,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginHorizontal: 8,
    marginBottom: 15,
  },
  toggleButtonActive: {
    backgroundColor: '#f8f9fa',
    borderColor: '#007AFF',
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666666',
    maxHeight:"auto",
    height:"auto",
  },
  toggleButtonTextActive: {
    color: '#007AFF',
  },
 
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginTop: 20,
  },
  button: {
    // flex: 1,
    padding: 15,
    // marginHorizontal: 5,
    // backgroundColor: "#007BFF",
    // borderRadius: 8,
    // alignItems: "center",
    // width:'90%',
    // height:"100%",
    backgroundColor: '#007BFF', // Blue background
    paddingVertical: 12,
    paddingHorizontal: 20, 
    borderRadius: 8, 
    justifyContent: 'center', 
  },
  deleteButton: {
    backgroundColor: "red",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  clearButton: {
    backgroundColor: '#ff4d4d',
    padding: 5,
    borderRadius: 3,
    alignItems: 'center',
    alignSelf: 'flex-end',  
    width: '30%',
    marginBottom: 15,
  },
  clearImageButton:{
    backgroundColor: '#ff4d4d',
    padding: 5,
    borderRadius: 3,
    alignItems: 'center',
    alignSelf: 'flex-end',  
    width: '30%',
    marginBottom: 15,
  },
  buttonSaving: {
    backgroundColor: '#A9A9A9', // Gray color when saving
  },
  buttonTextSaving: {
    color: '#FFFFFF', // Keep text white or adjust to a contrasting color if needed
  },
  
  clearButtonText: {
    color: '#fff',  // White text color
    fontSize: 14,
    fontWeight: 'bold',
  },
  clearImageButtonText:{
    color: '#fff',  // White text color
    fontSize: 14,
    fontWeight: 'bold',
  },
  // tableFooter: {
  //   marginTop: 10,
  //   padding: 10,
  //   borderTopWidth: 1,
  //   borderColor: '#ccc',
  //   backgroundColor: '#f9f9f9',
  // },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 5,
  },
  footerText: {
    paddingLeft:3,
    fontSize:12,
    fontWeight: 'bold',
  },
  footerInput: {
    // borderWidth: 1,
    // borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 5,
    // backgroundColor: '#eaeaea',
  },
  optionsContainer: {
    position: 'absolute',
    // right: 10,
    // top: 10,
    backgroundColor: 'white',
    // borderRadius: 5,
    // padding: 5,
    // borderWidth: 1,
    // borderColor: '#ddd',
    // zIndex: 10,
  },
  required: {
    color: "red",
  },
  placeholder: {
    color: "#aaa",
  },
  error: {
    color: "red",
    marginTop: 5,
    fontSize: 12,
  },
  input: {
    flex: 1,
    height: 45,  // Increased height for better accessibility
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,  // Slightly larger border radius for rounded corners
    paddingLeft: 12,  // Increased padding for better spacing inside the box
    fontSize: 16,
    color: "#333",
    backgroundColor: '#f8f8f8',  // Light background for better visibility
    marginBottom: 15,  // Added margin for spacing between fields
  },
   textboxContainer: {
    flex: 1,
    height: 45,  // Increased height for better accessibility
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,  // Slightly larger border radius for rounded corners
    paddingLeft: 12,  // Increased padding for better spacing inside the box
    fontSize: 16,
    color: "#333",
    backgroundColor: '#f8f8f8',  // Light background for better visibility
    marginBottom: 15, // Centers content horizontally inside the container
  },
  textInput: {
    width: '100%', // Ensures the input takes the full width of the container
    borderWidth: 1,
    borderColor: '#CCCCCC',
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    alignSelf: 'center', // Ensures the input is centered in the container
  },
  getbyidbutton: {
    backgroundColor: '#007BFF', // Blue background
    paddingVertical: 12,
    paddingHorizontal: 20, 
    borderRadius: 8, 
    justifyContent: 'center', 
    // shadowColor: '#2c3e50', // Shadow color for depth
    // shadowOpacity: 0.2, // Shadow opacity
    // shadowRadius: 4, // Shadow blur
    // elevation: 5, // Elevation for Android shadow
    // alignItems: 'center', // Centers the content horizontally
    // marginTop: 10, // Adds some space from the top
    // alignSelf: 'flex-start', // Aligns button to the start of the container
  },
  getbyidbuttonText: {
    color: '#ffffff', // White text color
    fontSize: 14, // Readable font size
    fontWeight: 'bold', // Bold font style
    // textTransform: 'uppercase', // Capitalize the text for emphasis
  },
//   label: {
//     width: 150,
//     fontSize: 16,
//     color: "#333",
//     marginBottom: 8,  // Adjusted margin for better spacing
//   },
//   inputField: {
//     flex: 1,
//     backgroundColor: "#fff",
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 15,  // Space between input fields
//   },
//   // Adjusting dropdown input styles for consistency
//   dropdown: {
//     borderWidth: 1,
//     borderColor: '#ccc',
//     padding: 12,
//     borderRadius: 8,
//     backgroundColor: '#fff',
//     width: '95%',
//     alignItems: 'center', 
//     marginBottom: 15,  // Space between dropdowns
//   },
//   recieptdropdown: {
//     borderWidth: 1,
//     borderColor: '#ccc',
//     padding: 12,
//     borderRadius: 8,
//     backgroundColor: '#fff',
//     alignItems: 'center', 
//     marginBottom: 15,  // Space between dropdowns
//   },
//   footerInput: {
//     borderRadius: 5,
//     paddingHorizontal: 10,  // Better padding for input feel
//     backgroundColor: '#eaeaea',  // Slight background color to indicate it's a text box
//     height: 40,  // Adjusted height for consistent size with other inputs
//   },
inputWrapper: {
  flexDirection: 'row',
  alignItems: 'center', // Vertically align items
},
flexInput: {
  flex: 1, // Make the input take the available space
},
calendarButton: {
  marginLeft: 8, // Space between the input and the button
  justifyContent: 'center',
  alignItems: 'center',
},
searchInput: {
  height: 40,
  borderColor: '#ccc',
  borderWidth: 1,
  borderRadius: 8,
  paddingHorizontal: 10,
  marginBottom: 10,
},

buttonDisabled: {
  backgroundColor: '#A9A9A9', // Gray background when disabled
},

buttonTextDisabled: {
  color: '#FFFFFF', // Keep text white (or adjust to a different color if preferred)
},
});

export default IncomingLogisticsScreen2;





