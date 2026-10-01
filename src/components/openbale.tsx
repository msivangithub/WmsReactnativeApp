import React, { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { View, Text, TextInput, FlatList, StyleSheet, ScrollView, Modal, TouchableOpacity, ToastAndroid, BackHandler, Alert } from "react-native";
import { Calendar } from 'react-native-calendars';
import { useApi } from "./APIcontext";
import { Dropdown } from "react-native-element-dropdown";

interface LRItem {
  label: string;
  value: string;
}

interface FormState {
  openBaleId: string;
  baleValue: string;
  openDate: string;
  receivedBales: string;
  lrno: string;
  balanceBales: string;
  billId: string;  
  billNo: string;
  openBales: string;
  partyName: string;
  noOfPcs: string;
  transportName: string;
  openBy: string;
  receivedDate: string;
  remarks: string;
  slNo : string;
}

type LRItems = {
  id:string;
  opendate: string;
  receivedBales: string;
  balanceBales: string;
  baleValue: string;
  openQty: string;
  receivedDate: string;
  openBaleId: string;
  lrno: string;
  billId: string;
  billNo: string;
  partyName: string;
  noOfPcs: string;
  transportName: string;
  openBy: string;
  remarks: string;
  slNo : string;
};

interface OpenBaleFormscreenprops {
  onBack: () => void; 
}

const OpenBaleForm: React.FC<OpenBaleFormscreenprops> = ({onBack}) => {
  const [formState, setFormState] = useState({
    openBaleId: "",
    baleValue: "",
    openDate: (() => {
      const date = new Date();
      const day = date.getDate().toString().padStart(2, '0');
      const month = date.toLocaleString('en-GB', { month: 'short' });
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    })(),
    receivedBales: "",
    lrno: "",
    balanceBales: "",
    billId: "",
    billNo: "",
    openBales: "",
    partyName: "",
    noOfPcs: "",
    transportName: "",
    openBy: "",
    receivedDate: "",
    remarks: ""
  });
  const [isCalendarVisible, setCalendarVisible] = useState(false);
  const [calendarField, setCalendarField] = useState("");
  const [Loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedLRNo, setSelectedLRNo] = useState<LRItem | null>(null);
  const [selectedbillNo, setSelectedbillNo] = useState<LRItem | null>(null);
  const [tableData, setTableData] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const [inputValue, setInputValue] = useState<string>('');
  const [inputNum, setInputNum] = useState<string>('');
  const [GetLRList, setGetLRList] = useState<LRItem[]>([]);
  const [getbyIdLR, setGetbyIdLR] = useState<LRItem[]>([]);
  const [billNodetails, setBillNodetails] = useState<LRItem[]>([]);
  const [getbyBillNo, setGetbyIdBillNo] = useState<LRItem[]>([]);
  const[openbaleId, setOpenbaleId] = useState<LRItem[]>([]);
  const [baleOpenValue, setBaleOpenValue] = useState<string>("");
  const [getbyBale , setGetbyBale] =  useState<LRItems[]>([]);
  const {API_URL} = useApi(); 

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

  const fetchGetLRNolist = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get(`${API_URL}/api/OpenBaleEntry/api/V1/GetLRNOList`);
      const getdetails = response.data[0]?.[0] || [];
      const formattedgetdetails = getdetails.map((item: { "LRId": any; "LRNo": any }) => ({
        label: item["LRNo"], 
        value: item["LRId"], 
      }));

      setGetLRList(formattedgetdetails);
    } catch (err) {
      setError("Failed to fetch LRId.");
    } finally {
      setLoading(false);
    }
  };

  const fetchGetByIdLRNODetails = async (inputValue: string) => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get<any[]>(`${API_URL}/api/OpenBaleEntry/api/V1/GetByIdLRNODetails?LRNO=${inputValue}`);
      
      const getdetails = response.data[0][0];  
      
      if (!Array.isArray(getdetails)) {
        throw new Error("Invalid data structure in response");
      }

      const formattedGetDetails = getdetails.map((item: { vend_Name: string; Transportname: string }) => ({
        label: item.Transportname,
        value: item.vend_Name,
      }));

      setGetbyIdLR(formattedGetDetails);
      
      if (formattedGetDetails.length > 0) {
        setFormState((prevState) => ({
          ...prevState,
          transportName: formattedGetDetails[0].label,  
          partyName: formattedGetDetails[0].value,     
        }));
      }
    } catch (err) {
      setError("Failed to fetch LRId.");
    } finally {
      setLoading(false);
    }
  };

  const fetchBillNoDetails = async (inputValue: any) => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get(`${API_URL}/api/OpenBaleEntry/api/V1/GetBillNODetails?LRNO=${inputValue}`);
      const getdetails = response.data[0]?.[0] || [];
      const formattedgetdetails = getdetails.map((item: { "BillId": any; "BillNo": any; "ItemName": any; "BrandName": any;}) => ({
        label: String(item.BillNo), 
        value: String(item.BillId),  
        itemName: item["ItemName"], 
        brandName: item["BrandName"],  
      }));
      
      setBillNodetails(formattedgetdetails);
    } catch (err) {
      setError("Failed to fetch LRId.");
    } finally {
      setLoading(false);
    }
  };

  const fetchGetByIdBillNoDetails = async (inputValue: string, inputNum: string) => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get(
        `${API_URL}/api/OpenBaleEntry/api/V1/GetByIdBillNODetails?BillNO=${inputNum}&LRNO=${inputValue}`
      );

      let data = response.data;

      if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0]) && data[0].length > 0 && Array.isArray(data[0][0])) {
        data = data[0][0][0]; 
      } else {
        throw new Error("Unexpected API response structure");
      }

      if (data && typeof data === "object") {
        const formattedgetdetails = [
          {
            value: data["BalanceBales"], 
            label: data["ReceivedBales"],
            BaleValue: data["BaleValue"],
            OpenQty: data["OpenQty"],
            ReceivedDate: data["ReceivedDate"]
          }
        ];

        setGetbyIdBillNo(formattedgetdetails);

        if (formattedgetdetails.length > 0) {
          setFormState((prevState) => ({
            ...prevState,
            balanceBales: String(formattedgetdetails[0].value),
            receivedBales: String(formattedgetdetails[0].label),
            baleValue: String(formattedgetdetails[0].BaleValue),
            receivedDate: String(formattedgetdetails[0].ReceivedDate)
          }));
        }
      } else {
        throw new Error("Invalid data structure in response");
      }
    } catch (err) {
      setError("Failed to fetch bill details");
    } finally {
      setLoading(false);
    }
  };

  const fetchOpenBaleId = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get(`${API_URL}/api/OpenBaleEntry/api/V1/GetOpenBaleList`);
      const getdetails = response.data[0]?.[0] || [];
      const formattedgetdetails = getdetails.map((item: { "OPenId": any; "OpenDate": any; }) => ({    
        label: item["OPenId"],   
        value: item["OPenId"],  
        date: item.OpenDate,
      }));
      
      setOpenbaleId(formattedgetdetails);
    } catch (err) {
      setError("Failed to fetch LRId.");
    } finally {
      setLoading(false);
    }
  };

  const fetchgetByIdOpenBale = async (baleOpenValue: any) => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get(`${API_URL}/api/OpenBaleEntry/api/V1/GetByIdOpenBaleDetails?OpenBaleId=${baleOpenValue}`);

      const data = response.data;

      if (data && Array.isArray(data) && data.length > 0 && Array.isArray(data[0]) && data[0].length > 0 && Array.isArray(data[0][0]) && data[0][0].length > 0) {
        const responseData = data[0][0][0]; 

        const formattedgetdetails: LRItems[] = [{
          id: String(responseData["SINo"] || Math.random()), 
          receivedBales: String(responseData["ReceivedBales"]), 
          balanceBales: String(responseData["BalanceBales"]),  
          baleValue: String(responseData["BalValue"]),
          openQty: String(responseData["OpenQty"]),
          receivedDate: responseData["ReceivedDate"],
          opendate: responseData["OpenDate"],
          openBaleId: responseData["OpenId"],
          lrno: responseData["LRId"],
          billId: String(responseData["BillId"]),
          billNo: responseData["Billno"],
          partyName: responseData["PartyName"],
          noOfPcs: String(responseData["NoOfPcs"]),
          transportName: responseData["Transporter"],
          openBy: responseData["OpenBy"],
          remarks: responseData["Remarks"],
          slNo: responseData["SINo"]
        }];

        setGetbyBale(formattedgetdetails);

        if (formattedgetdetails.length > 0) {
          setFormState((prevState) => ({
            ...prevState,
            balanceBales: formattedgetdetails[0].balanceBales,  
            receivedBales: formattedgetdetails[0].receivedBales,
            baleValue: formattedgetdetails[0].baleValue, 
            openBales: formattedgetdetails[0].openQty,
            receivedDate: formattedgetdetails[0].receivedDate,  
            openBaleId: formattedgetdetails[0].openBaleId,
            lrno: formattedgetdetails[0].lrno,
            billId: formattedgetdetails[0].billId,
            billNo: formattedgetdetails[0].billNo,
            partyName: formattedgetdetails[0].partyName,
            noOfPcs: formattedgetdetails[0].noOfPcs,
            transportName: formattedgetdetails[0].transportName,
            openBy: formattedgetdetails[0].openBy,
            remarks: formattedgetdetails[0].remarks,
            openDate: formattedgetdetails[0].opendate,
            slNo: formattedgetdetails[0].slNo
          }));
          
          setSelectedLRNo({
            label: String(formattedgetdetails[0].lrno),
            value: String(formattedgetdetails[0].lrno)
          });
          
          setSelectedbillNo({
            label: String(formattedgetdetails[0].billNo),
            value: String(formattedgetdetails[0].billId)
          });
          
          setInputValue(String(formattedgetdetails[0].lrno));
          setInputNum(String(formattedgetdetails[0].billId));
        }
      } else {
        throw new Error("Invalid data structure in response");
      }
    } catch (err) {
      setError("Failed to fetch bill details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setGetLRList([]);
    setGetbyIdLR([]);
    setGetbyIdBillNo([]);
    setOpenbaleId([]);

    fetchGetLRNolist();
    if (inputValue ) {
      fetchGetByIdLRNODetails(inputValue);
      fetchBillNoDetails(inputValue);
    }
    fetchOpenBaleId();
    if(baleOpenValue){
      fetchgetByIdOpenBale(baleOpenValue);
    }
    if (inputValue && inputNum) {
      fetchGetByIdBillNoDetails(inputValue, inputNum);
    }
  }, [API_URL, inputValue, inputNum, baleOpenValue]); 

  const onCalendarPress = (field: string) => {
    setCalendarField(field);
    setCalendarVisible(true);
  };

  const handleDateSelection = (date: { dateString: string }) => {
    if (calendarField) {
      const selectedDate = new Date(date.dateString);
      const day = selectedDate.getDate().toString().padStart(2, "0"); 
      const month = selectedDate.toLocaleString("en-GB", { month: "short" }); 
      const year = selectedDate.getFullYear();
  
      const formattedDate = `${day}-${month}-${year}`; 
  
      setFormState((prev) => ({
        ...prev,
        [calendarField]: formattedDate,
      }));
    }
    setCalendarVisible(false);
  };

  const handleChange = (name: string, value: string) => {
    const numericValue = parseInt(value, 10) || 0; 
    
    if (name === "openBales") {
      const balanceBalesValue = parseInt(formState.balanceBales, 10);
    
      if (numericValue > balanceBalesValue) {
        ToastAndroid.show("Open Bales should not be greater than Balance Bales!", ToastAndroid.SHORT);
        return; 
      }
    }
    
    if (name === "noOfPcs") {
      const balePcsValue = parseInt(formState.baleValue, 10) || 0; 
    
      if (numericValue > balePcsValue) {
        ToastAndroid.show("No of Pieces should not be greater than Bale Value!", ToastAndroid.SHORT);
        return; 
      }
    }
    
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleLRSelection = (item: { label: string; value: string }) => {
    setSelectedLRNo(item);
    setFormState(prevState => ({
      ...prevState,
      lrno: item.value,  
    }));
    setInputValue(item.value);
    fetchGetByIdLRNODetails(item.value);
    fetchBillNoDetails(item.value);
  };

  const validateFields = (fields: { key: keyof typeof formState; label: string }[]) => {
    for (const field of fields) {
      if (!formState[field.key]) {
        ToastAndroid.show(`Please fill the field: ${field.label}`, ToastAndroid.SHORT);
        return false;
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (isVisible) {
      Alert.alert(
        "Save Disabled",
        "You are currently in Show mode. Please exit Show mode to save.",
        [{ text: "OK" }]
      );
      return;
    }
  
    // Define required fields with labels
    const requiredFields: { key: keyof typeof formState; label: string }[] = [
      { key: "lrno", label: "LR/GR No" },
      { key: "billNo", label: "Bill No" },
      { key: "baleValue", label: "Bale Value" },
      { key: "openDate", label: "Open Date" },
      { key: "receivedBales", label: "Received Bales" },
      { key: "balanceBales", label: "Balance Bales" },
      { key: "openBales", label: "Open Bales" },
      { key: "partyName", label: "Party Name" },
      { key: "noOfPcs", label: "No of Pieces" },
      { key: "transportName", label: "Transport Name" },
      { key: "openBy", label: "Open By" },
      { key: "receivedDate", label: "Received Date" },
      { key: "remarks", label: "remarks" },
    ];
  
    // Validate each field one by one
    if (!validateFields(requiredFields)) {
      return;
    }
  
    Alert.alert(
      "Confirm Save",
      "Do you want to save the record?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "OK",
          onPress: async () => {
            try {
              setLoading(true);
              const dataToSave = {
                openBaleId: formState.openBaleId,
                baleValue: formState.baleValue,
                openDate: formState.openDate,
                receivedBales: formState.receivedBales,
                lrno: formState.lrno,
                balanceBales: formState.balanceBales,
                billId: formState.billId,
                billNo: formState.billNo,
                openBales: formState.openBales,
                partyName: formState.partyName,
                noOfPcs: formState.noOfPcs,
                transportName: formState.transportName,
                openBy: formState.openBy,
                receivedDate: formState.receivedDate,
                remarks: formState.remarks
              };
  
              console.log(JSON.stringify(formState, null, 2));
              const response = await axios.post(
                `${API_URL}/api/OpenBaleEntry/api/V1/Save`,
                dataToSave,
                {
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  timeout: 10000,
                }
              );
  
              if (response.status === 200 || response.status === 201) {
                const textResponse = response.data;
                ToastAndroid.show(textResponse, ToastAndroid.SHORT);
  
                // Reset form state
                setFormState({
                  openBaleId: "",
                  baleValue: "",
                  openDate: (() => {
                    const date = new Date();
                    const day = date.getDate().toString().padStart(2, '0');
                    const month = date.toLocaleString('en-GB', { month: 'short' });
                    const year = date.getFullYear();
                    return `${day}-${month}-${year}`;
                  })(),
                  receivedBales: "",
                  lrno: "",
                  balanceBales: "",
                  billId: "",
                  billNo: "",
                  openBales: "",
                  partyName: "",
                  noOfPcs: "",
                  transportName: "",
                  openBy: "",
                  receivedDate: "",
                  remarks: ""
                });
  
                // Clear dropdown selections
                setSelectedLRNo(null);
                setSelectedbillNo(null);
  
                // Reset input values
                setInputValue("");
                setInputNum("");
  
                // Refresh dropdown data
                await fetchGetLRNolist();
                await fetchBillNoDetails(inputValue);
                await fetchOpenBaleId();
  
              } else {
                throw new Error(`Server returned unexpected status ${response.status}`);
              }
            } catch (error) {
              let errorMessage = "There was an issue saving the data.";
  
              if (axios.isAxiosError(error)) {
                errorMessage = error.response?.data?.message || errorMessage;
              } else if (error instanceof Error) {
                errorMessage = error.message;
              }
              ToastAndroid.show(errorMessage, ToastAndroid.SHORT);
              // Alert.alert("Error", errorMessage);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleShow = () => {
    setIsVisible((prev) => !prev);
  };

  const handleClear = () => {
    Alert.alert(
      "Confirm Clear", 
      "Do you want to clear the Data?", 
      [
        { text: "Cancel", style: "cancel" }, 
        { 
          text: "OK", 
          onPress: () => {
            // Reset form state
            setFormState({
              openBaleId: "",
              baleValue: "",
              openDate: (() => {
                const date = new Date();
                const day = date.getDate().toString().padStart(2, '0'); 
                const month = date.toLocaleString('en-GB', { month: 'short' }); 
                const year = date.getFullYear();
                return `${day}-${month}-${year}`;
              })(),
              receivedBales: "",
              lrno: "",
              balanceBales: "",
              billId: "",
              billNo: "",
              openBales: "",
              partyName: "",
              noOfPcs: "",
              transportName: "",
              openBy: "",
              receivedDate: "",
              remarks: ""
            });
  
            // Clear dropdown selections
            setSelectedLRNo(null);
            setSelectedbillNo(null);
  
            // Reset input values
            setInputValue("");
            setInputNum("");
  
            // Reset other states
            setBaleOpenValue("");
            setGetbyBale([]);
  
            // Alert.alert("Success", "Data cleared successfully!");
            ToastAndroid.show("Data cleared successfully!", ToastAndroid.SHORT);
          } 
        } 
      ]
    );
    setIsVisible(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView>
      <Text style={styles.header}>Open Bale Entry</Text>
      <View style={styles.formContainer}>
        <View style={styles.formSection}>
        <View style={styles.inputGroup}>
          {isVisible && (
            <>
              <Text style={styles.label}>Open BaleId :</Text>
              <Dropdown
                // style={styles.input}
                style={[styles.input, { backgroundColor: '#fff' }]}
                selectedTextStyle={{ color: '#000' }}        
                itemTextStyle={{ color: '#000' }}   
                data={openbaleId}  
                labelField="label" 
                valueField="value"
                search
                searchPlaceholder="Search OpenBale Id..."
                placeholder="Select OpenBale Id"
                placeholderStyle={{ color: 'gray' }}
                value={formState.openBaleId} 
                onChange={(item: { label: string; value: string }) => {
                  handleChange("openBaleId", item.label);
                  setBaleOpenValue(item.label);
                }} 
              />
            </>
          )}
        </View>
        </View>

        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Open Date :</Text>
            <View style={styles.dateInputContainer}>
              <TextInput 
                style={styles.dateInput} 
                value={formState.openDate}  
                onChangeText={(text) => handleChange("openDate", text)} 
                onPressIn={() => onCalendarPress("openDate")} 
              />
              <TouchableOpacity style={styles.calendarButton} onPress={() => onCalendarPress("openDate")}>
                <Text style={styles.calendarIcon}>📅</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>LR/GR No <Text style={styles.required}>*</Text>:</Text>
          </View>
          {!formState.lrno && (
            <Text style={styles.required}>LR/GR No is required</Text>
          )}
          
          {formState.lrno && formState.openBaleId ? (
            <TextInput 
              style={[styles.input, { backgroundColor: '#f0f0f0' }]} 
              value={formState.lrno}
              editable={false}
            />
          ) : (
            <Dropdown
              // style={styles.input}
              style={[styles.input, { backgroundColor: '#fff' }]}
              selectedTextStyle={{ color: '#000' }}        
              itemTextStyle={{ color: '#000' }}   
              data={GetLRList}  
              labelField="label" 
              valueField="value"
              search
              searchPlaceholder="Search LR No..."
              placeholder="Select LR/GR No"
              placeholderStyle={{ color: 'gray' }}
              value={formState.lrno} 
              onChange={handleLRSelection}
            />
          )}
        </View> 

        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bill No <Text style={styles.required}>*</Text>:</Text>
          </View>
          {!formState.billNo && (
            <Text style={styles.required}>Bill No is required</Text>
          )}
          
          {formState.billNo && formState.openBaleId ? (
            <TextInput 
              style={[styles.input, { backgroundColor: '#f0f0f0' }]} 
              value={formState.billNo}
              editable={false}
            />
          ) : (
            <Dropdown
              // style={styles.input}
              style={[styles.input, { backgroundColor: '#fff' }]}
              selectedTextStyle={{ color: '#000' }}        
              itemTextStyle={{ color: '#000' }}   
              data={billNodetails}  
              labelField="label" 
              valueField="label"   
              search
              searchPlaceholder="Search Bill No..."
              placeholder="Select Bill No"
              placeholderStyle={{ color: 'gray' }}
              value={formState.billNo} 
              onChange={(item: { label: string; value: string }) => {
                setSelectedbillNo(item);
                setFormState((prevState) => ({
                  ...prevState,
                  billNo: item.label,
                  billId: item.value,
                }));
                setInputNum(item.value);
              }}
            />
          )}
        </View>

        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Party Name :</Text>
            <TextInput 
              style={styles.input} 
              value={formState.partyName} 
              onChangeText={(text) => handleChange("partyName", text)} 
              editable={false}
            />
          </View>
        </View>

        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Transport Name :</Text>
            <TextInput 
              style={styles.input} 
              value={formState.transportName} 
              onChangeText={(text) => handleChange("transportName", text)} 
              editable={false}
            />
          </View>
        </View>

        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Received Date :</Text>
            <TextInput 
              style={styles.input} 
              value={formState.receivedDate} 
              onChangeText={(text) => handleChange("receivedDate", text)} 
              onPressIn={() => onCalendarPress("receivedDate")} 
              editable={false}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bale Value : </Text>
            <TextInput 
              style={styles.input} 
              value={formState.baleValue} 
              onChangeText={(text) => handleChange("baleValue", text)} 
              editable={false}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Received Bales :</Text>
            <TextInput 
              style={styles.input} 
              value={formState.receivedBales} 
              onChangeText={(text) => handleChange("receivedBales", text)} 
              editable={false}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Balance Bales :</Text>
            <TextInput 
              style={styles.input} 
              value={formState.balanceBales} 
              onChangeText={(text) => handleChange("balanceBales", text)} 
              editable={false}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Open Bales { <Text style={styles.required}>*</Text>} :</Text>
            {!formState.openBales && (
              <Text style={{ color: 'red' }}>Open Bales is required</Text>
            )}
            <TextInput 
              style={styles.input} 
              value={formState.openBales} 
              keyboardType="numeric"
              onChangeText={(text) => handleChange("openBales", text)} 
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>No Of Pcs { <Text style={styles.required}>*</Text>} :</Text>
            {!formState.noOfPcs && (
              <Text style={{ color: 'red' }}>No Of Pcs is required</Text>
            )}
            <TextInput 
              style={styles.input} 
              value={formState.noOfPcs} 
              keyboardType="numeric"
              onChangeText={(text) => handleChange("noOfPcs", text)} 
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Open By  { <Text style={styles.required}>*</Text>} :</Text>
            {!formState.openBy && (
              <Text style={{ color: 'red' }}>OpenBy is required</Text>
            )}
            <TextInput 
              style={styles.input} 
              value={formState.openBy} 
              onChangeText={(text) => handleChange("openBy", text)} 
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Remarks { <Text style={styles.required}>*</Text>} :</Text>
            {!formState.remarks && (
              <Text style={{ color: 'red' }}>Remarks is required</Text>
            )}
            <TextInput 
              style={styles.input} 
              value={formState.remarks} 
              onChangeText={(text) => handleChange("remarks", text)} 
            />
          </View>
        </View>
      </View>
      {isVisible && (
        <View style={styles.tableContainer}>
          <ScrollView horizontal>
            <FlatList
              data={getbyBale}
              keyExtractor={(item) => item.id}
              ListHeaderComponent={
                <View style={styles.tableHeader}>
                  <Text style={styles.tableHeaderText}>Sl.No</Text>
                  <Text style={styles.tableHeaderText}>LR/GR No</Text>
                  <Text style={styles.tableHeaderText}>Open Bale ID</Text>
                  <Text style={styles.tableHeaderText}>Open Qty</Text>
                  <Text style={styles.tableHeaderText}>Open By</Text>
                  <Text style={styles.tableHeaderText}>Open Date</Text>
                  <Text style={styles.tableHeaderText}>Bill No</Text>
                  <Text style={styles.tableHeaderText}>Remarks</Text>
                  <Text style={styles.tableHeaderText}>Bill ID</Text>
                  <Text style={styles.tableHeaderText}>No. of Pcs</Text>
                </View>
              }
              renderItem={({ item, index }) => (
                <View style={[styles.tableRow, index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd]}>
                  <Text style={styles.tableCell}>{String(index + 1)}</Text>
                  <Text style={styles.tableCell}>{String(item.lrno)}</Text>
                  <Text style={styles.tableCell}>{String(item.openBaleId)}</Text>
                  <Text style={styles.tableCell}>{String(item.openQty)}</Text>
                  <Text style={styles.tableCell}>{String(item.openBy)}</Text>
                  <Text style={styles.tableCell}>{String(item.opendate)}</Text>
                  <Text style={styles.tableCell}>{String(item.billNo)}</Text>
                  <Text style={styles.tableCell}>{String(item.remarks)}</Text>
                  <Text style={styles.tableCell}>{String(item.billId)}</Text>
                  <Text style={styles.tableCell}>{String(item.noOfPcs)}</Text>
                </View>
              )}
            />
          </ScrollView>
        </View>
      )}

      <View style={styles.button}>
        <TouchableOpacity 
          style={[
            styles.saveButton, 
            isVisible && { backgroundColor: '#CCCCCC' }
          ]} 
          onPress={handleSave}
          disabled={isVisible}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.saveButton,
            formState.openBaleId && { backgroundColor: '#CCCCCC' }
          ]} 
          onPress={handleShow}
          disabled={!!formState.openBaleId}
        >
          <Text style={styles.saveButtonText}>{isVisible ? "Hide" : "Show"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={isCalendarVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.calendarWrapper}>
            <Calendar onDayPress={handleDateSelection} />
            <TouchableOpacity style={styles.closeButton} onPress={() => setCalendarVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingTop: 10,
  },
  header: {
    fontSize: 24,
    color: 'white',
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 15,
    width: '100%',
    backgroundColor: '#4CAF50',
    padding: 10,
    marginBottom: 20,
  },
  formContainer: {
    backgroundColor: "#fff",
    padding: 15,
    margin: 10,
    borderRadius: 5,
  },
  formSection: {},
  inputGroup: {
    width: "100%",
  },
  label: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
    fontWeight: "bold",
  },
  dateInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#f8f8f8",
    height: 45,
    paddingLeft: 12,
    marginBottom: 15,
  },
  dateInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    height: "100%",
  },
  input: {
    flex: 1,
    height: 45,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 12,
    fontSize: 16,
    color: "#333",
    backgroundColor: '#f8f8f8',
    marginBottom: 15,
  },
  tableContainer: {
    margin: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  tableHeaderText: {
    flex: 1,
    fontWeight: "bold",
    fontSize: 14,
    color: "#fff",
    textAlign: "center",
    minWidth: 150,
    maxWidth: 150,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tableRowEven: {
    backgroundColor: "#f8f8f8",
  },
  tableRowOdd: {
    backgroundColor: "#fff",
  },
  tableCell: {
    flex: 1,
    fontSize: 13,
    color: "#333",
    textAlign: "center",
    minWidth: 100,
    maxWidth: 150,
    paddingHorizontal: 4,
    flexWrap: 'wrap',
  },
  calendarWrapper: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  closeButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#ff5c5c",
    borderRadius: 5,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  button: {
    flexDirection: "row",
    gap: 10,
    alignSelf: "flex-end",
  },
  saveButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginTop: 10,
    padding: 5,
    alignItems: 'center',
    width: '30%',
    marginBottom: 15,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  clearButton: {
    backgroundColor: "#FF5733",
    padding: 10,
    borderRadius: 5,
    margin: 10,
    width: '30%',
    alignItems: "center",
  },
  clearButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  calendarButton: {
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  calendarIcon: {
    fontSize: 20,
    color: "#333",
  },
  required: {
    color: "red",
  },
});

export default OpenBaleForm;