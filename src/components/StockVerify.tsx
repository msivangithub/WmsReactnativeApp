import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Modal,
    ActivityIndicator,
    ToastAndroid,
    Dimensions,
    Alert,
    BackHandler,
    Keyboard,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import BarcodeScanner from './Barcodescan';
import { useApi } from './APIcontext';

interface StockItem {
    itemCode: string;
    itemName: string;
    mrp: number;
    qty: number;
    sQty: number;
    shortage: number;
    excess: number;
    categorytype?: string;
    divid?: string;
    deptId?: string;
    catId?: string;
    subCatId?: string;
    brandId?: string;
    styleId?: string;
    sizeId?: string;
    colorId?: string;
    desId?: string;
    uomId?: string;
    oemcode?: string;
    t?: string;
    isHighlighted: boolean | undefined;
}

interface StockVerifyProps {
    onBack: () => void;
}

const StockVerify: React.FC<StockVerifyProps> = ({ onBack }) => {
    const [salesman, setSalesman] = useState('');
    const [rack, setRack] = useState('');
    const [remarks, setRemarks] = useState('');
    const [itemCode, setItemCode] = useState('');
    const [showScanner, setShowScanner] = useState(false);
    const [showSalesmanModal, setShowSalesmanModal] = useState(false);
    const [salesmenList, setSalesmenList] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { API_URL } = useApi();
    const [stockItems, setStockItems] = useState<StockItem[]>([]);
    const [qtyTotal, setQtyTotal] = useState(0);
    const [sQtyTotal, setSQtyTotal] = useState(0);
    const [shortageTotal, setShortageTotal] = useState(0);
    const [excessTotal, setExcessTotal] = useState(0);
    const [showSQtyModal, setShowSQtyModal] = useState(false);
    const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
    const [sQtyInput, setSQtyInput] = useState('');
    const [isLandscape, setIsLandscape] = useState(
        Dimensions.get('window').width > Dimensions.get('window').height
    );
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [decimalPrecision, setDecimalPrecision] = useState<2 | 3>(2);
    const [showItemSelectionModal, setShowItemSelectionModal] = useState(false);
    const [itemList, setItemList] = useState<any[]>([]);

    const scrollViewRef = useRef<ScrollView>(null);
    const itemCodeInputRef = useRef<TextInput>(null);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

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
        if (isKeyboardVisible && itemCodeInputRef.current) {
            itemCodeInputRef.current.focus();
        }
    }, [isKeyboardVisible]);

    const focusItemCodeInput = () => {
        itemCodeInputRef.current?.focus();
    };

    const getDecimalPlaces = (num: number): number => {
        const str = num.toString();
        const decimalIndex = str.indexOf('.');
        if (decimalIndex === -1) return 0;
        return str.length - decimalIndex - 1;
    };

    useEffect(() => {
        const updateOrientation = () => {
            const { width, height } = Dimensions.get('window');
            setIsLandscape(width > height);
        };
        const subscription = Dimensions.addEventListener('change', updateOrientation);
        return () => subscription?.remove();
    }, []);

    useEffect(() => {
        const backAction = () => {
            Alert.alert(
                'Confirm Exit',
                'Are you sure you want to go back? Any unsaved changes will be lost.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'OK', onPress: () => onBack() },
                ]
            );
            return true;
        };

        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
        return () => backHandler.remove();
    }, [onBack]);

    const showLongToast = (message: string, totalDuration = 10000) => {
        const interval = 3000;
        let elapsed = 0;
        const intervalId = setInterval(() => {
            ToastAndroid.show(message, ToastAndroid.LONG);
            elapsed += interval;
            if (elapsed >= totalDuration) clearInterval(intervalId);
        }, interval);
    };

    function englishHBSFromDate(dateObj: Date) {
        const day = dateObj.getDate();
        const month = dateObj.getMonth() + 1;
        const year = dateObj.getFullYear();
        const result = (year - 1950) * 416 + month * 32 + day;
        return result;
    }

    const currentdate = englishHBSFromDate(new Date()).toString();

    const fetchSalesMenList = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(
                `${API_URL}/api/StockVerifyEntry/api/V1/GetSalesMenList`
            );
            const list = response.data;
            let flatList: any[] = [];
            if (Array.isArray(list) && Array.isArray(list[0]) && Array.isArray(list[0][0])) {
                flatList = list[0][0].map((item) => ({
                    smId: item.SMID,
                    smName: item.SMName,
                }));
            }
            setSalesmenList(flatList.length > 0 ? flatList : [{ smId: 1, smName: 'N/A' }]);
        } catch (error) {
            console.error('Error fetching SalesMen List:', error);
            ToastAndroid.show('Failed to fetch SalesMen List.', ToastAndroid.SHORT);
            setSalesmenList([{ smId: '', smName: '' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchItemDetails = async (code: string) => {
        if (!salesman) {
            ToastAndroid.show('Please select a salesman.', ToastAndroid.SHORT);
            return;
        }
        setIsLoading(true);
        try {
            const response = await axios.get(
                `${API_URL}/api/StockVerifyEntry/api/V1/GetByIdItemCodeDetails?ItemCode=${code}`
            );

            const data = response.data;
            if (!data || !Array.isArray(data[0]) || !Array.isArray(data[0][0]) || !data[0][0].length) {
                ToastAndroid.show('No item found for this OEM code.', ToastAndroid.SHORT);
                setItemCode('');
                return;
            }
            const items = data[0][0];
            console.log(items);
            if (items.length > 1) {
                setItemList(items);
                setShowItemSelectionModal(true);
                setItemCode('');
                setIsLoading(false);
                return;
            }

            const item = items[0];
            if (!item.itemcode || !item.ItemDesc || typeof item.Rate !== 'number' || typeof item.Curqty !== 'number') {
                ToastAndroid.show('Invalid item data.', ToastAndroid.SHORT);
                setItemCode('');
                return;
            }

            const curQtyDecimalPlaces = getDecimalPlaces(item.Curqty);
            const newDecimalPrecision = curQtyDecimalPlaces === 2 ? 2 : 2;
            setDecimalPrecision(newDecimalPrecision);

            const existingItemIndex = stockItems.findIndex((i) => i.itemCode === item.itemcode);
            if (item.categorytype === 'P' && existingItemIndex !== -1) {
                Alert.alert('Duplicate Item', 'This item has already been scanned.', [
                    { text: 'Cancel', style: 'cancel' },
                ]);
                setItemCode('');
                return;
            }

            const curQty = parseFloat(item.Curqty.toFixed(newDecimalPrecision));
            let sQty = existingItemIndex !== -1 ? stockItems[existingItemIndex].sQty + 1 : 1;
            sQty = parseFloat(sQty.toFixed(newDecimalPrecision));
            let shortage = curQty >= sQty ? parseFloat((curQty - sQty).toFixed(newDecimalPrecision)) : 0;
            let excess = curQty < sQty ? parseFloat((sQty - curQty).toFixed(newDecimalPrecision)) : 0;
            const t = curQty >= sQty ? 'S' : 'E';

            const newItem: StockItem = {
                itemCode: item.itemcode,
                itemName: item.ItemDesc,
                mrp: parseFloat(item.Rate.toFixed(newDecimalPrecision)),
                qty: curQty,
                sQty,
                shortage,
                excess,
                categorytype: item.categorytype,
                divid: item.divid || '',
                deptId: item.deptId || '',
                catId: item.catId || '',
                subCatId: item.subCatId || '',
                brandId: item.brandId || '',
                styleId: item.styleId || '',
                sizeId: item.sizeId || '',
                colorId: item.colorId || '',
                desId: item.desId || '',
                uomId: item.uomId || '',
                oemcode: item.Oem_Code || '',
                t,
                isHighlighted: item.categorytype === 'L' && existingItemIndex !== -1,
            };

            setStockItems((prevItems) => {
                const updatedItems = [...prevItems.map((item) => ({
                    ...item,
                    isHighlighted: item.categorytype === 'L' ? undefined : item.isHighlighted,
                    qty: parseFloat(item.qty.toFixed(newDecimalPrecision)),
                    sQty: parseFloat(item.sQty.toFixed(newDecimalPrecision)),
                    shortage: parseFloat(item.shortage.toFixed(newDecimalPrecision)),
                    excess: parseFloat(item.excess.toFixed(newDecimalPrecision)),
                    mrp: parseFloat(item.mrp.toFixed(newDecimalPrecision)),
                }))];
                if (existingItemIndex !== -1) {
                    updatedItems[existingItemIndex] = newItem;
                } else {
                    updatedItems.push(newItem);
                }
                setQtyTotal(parseFloat(updatedItems.reduce((sum, item) => sum + item.qty, 0).toFixed(newDecimalPrecision)));
                setSQtyTotal(parseFloat(updatedItems.reduce((sum, item) => sum + item.sQty, 0).toFixed(newDecimalPrecision)));
                setShortageTotal(parseFloat(updatedItems.reduce((sum, item) => sum + item.shortage, 0).toFixed(newDecimalPrecision)));
                setExcessTotal(parseFloat(updatedItems.reduce((sum, item) => sum + item.excess, 0).toFixed(newDecimalPrecision)));

                // Scroll to the last item
                const rowHeight = 80; // As defined in styles.tableRow minHeight
                const lastItemIndex = existingItemIndex !== -1 ? existingItemIndex : updatedItems.length - 1;
                setTimeout(() => {
                    scrollViewRef.current?.scrollTo({
                        y: lastItemIndex * rowHeight,
                        animated: true,
                    });
                }, 100);

                return updatedItems;
            });

            setItemCode('');
        } catch (error) {
            console.error('Error fetching item details:', error);
            ToastAndroid.show('No item found or invalid OEM code.', ToastAndroid.SHORT);
            setItemCode('');
        } finally {
            setIsLoading(false);
        }
    };

    const handleItemSelection = (item: any) => {
        if (!item.itemcode || !item.ItemDesc || typeof item.Rate !== 'number' || typeof item.Curqty !== 'number') {
            ToastAndroid.show('Invalid item data.', ToastAndroid.SHORT);
            setShowItemSelectionModal(false);
            return;
        }

        const curQtyDecimalPlaces = getDecimalPlaces(item.Curqty);
        const newDecimalPrecision = curQtyDecimalPlaces === 2 ? 2 : 2;
        setDecimalPrecision(newDecimalPrecision);

        const existingItemIndex = stockItems.findIndex((i) => i.itemCode === item.itemcode);
        if (item.categorytype === 'P' && existingItemIndex !== -1) {
            Alert.alert('Duplicate Item', 'This item has already been scanned.', [
                { text: 'Cancel', style: 'cancel' },
            ]);
            setShowItemSelectionModal(false);
            return;
        }

        const curQty = parseFloat(item.Curqty.toFixed(newDecimalPrecision));
        let sQty = existingItemIndex !== -1 ? stockItems[existingItemIndex].sQty + 1 : 1;
        sQty = parseFloat(sQty.toFixed(newDecimalPrecision));
        let shortage = curQty >= sQty ? parseFloat((curQty - sQty).toFixed(newDecimalPrecision)) : 0;
        let excess = curQty < sQty ? parseFloat((sQty - curQty).toFixed(newDecimalPrecision)) : 0;
        const t = curQty >= sQty ? 'S' : 'E';

        const newItem: StockItem = {
            itemCode: item.itemcode,
            itemName: item.ItemDesc,
            mrp: parseFloat(item.Rate.toFixed(newDecimalPrecision)),
            qty: curQty,
            sQty,
            shortage,
            excess,
            categorytype: item.categorytype,
            divid: item.divid || '',
            deptId: item.deptId || '',
            catId: item.catId || '',
            subCatId: item.subCatId || '',
            brandId: item.brandId || '',
            styleId: item.styleId || '',
            sizeId: item.sizeId || '',
            colorId: item.colorId || '',
            desId: item.desId || '',
            uomId: item.uomId || '',
            oemcode: item.Oem_Code || '',
            t,
            isHighlighted: item.categorytype === 'L' && existingItemIndex !== -1,
        };

        setStockItems((prevItems) => {
            const updatedItems = [...prevItems.map((item) => ({
                ...item,
                isHighlighted: item.categorytype === 'L' ? undefined : item.isHighlighted,
                qty: parseFloat(item.qty.toFixed(newDecimalPrecision)),
                sQty: parseFloat(item.sQty.toFixed(newDecimalPrecision)),
                shortage: parseFloat(item.shortage.toFixed(newDecimalPrecision)),
                excess: parseFloat(item.excess.toFixed(newDecimalPrecision)),
                mrp: parseFloat(item.mrp.toFixed(newDecimalPrecision)),
            }))];
            if (existingItemIndex !== -1) {
                updatedItems[existingItemIndex] = newItem;
            } else {
                updatedItems.push(newItem);
            }
            setQtyTotal(parseFloat(updatedItems.reduce((sum, item) => sum + item.qty, 0).toFixed(newDecimalPrecision)));
            setSQtyTotal(parseFloat(updatedItems.reduce((sum, item) => sum + item.sQty, 0).toFixed(newDecimalPrecision)));
            setShortageTotal(parseFloat(updatedItems.reduce((sum, item) => sum + item.shortage, 0).toFixed(newDecimalPrecision)));
            setExcessTotal(parseFloat(updatedItems.reduce((sum, item) => sum + item.excess, 0).toFixed(newDecimalPrecision)));

            // Scroll to the last item
            const rowHeight = 80; // As defined in styles.tableRow minHeight
            const lastItemIndex = existingItemIndex !== -1 ? existingItemIndex : updatedItems.length - 1;
            setTimeout(() => {
                scrollViewRef.current?.scrollTo({
                    y: lastItemIndex * rowHeight,
                    animated: true,
                });
            }, 100);

            return updatedItems;
        });

        setShowItemSelectionModal(false);
        setItemList([]);
        focusItemCodeInput();
    };

    const handleSave = () => {
        if (!salesman || !stockItems.length) {
            ToastAndroid.show('Select a salesman and add at least one item.', ToastAndroid.SHORT);
            return;
        }
        Alert.alert('Confirm Save', 'Save this stock verification?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Save', onPress: proceedWithSave },
        ]);
    };

    const proceedWithSave = async () => {
        setIsLoading(true);
        try {
            const payload = {
                scanItems: stockItems.map((item, index) => ({
                    itemName: item.itemName,
                    qty: item.qty.toFixed(decimalPrecision),
                    rate: item.mrp.toFixed(decimalPrecision),
                    splRate: (item.mrp - 100).toFixed(decimalPrecision),
                    itemCode: item.itemCode,
                    divid: item.divid || '',
                    deptId: item.deptId || '',
                    catId: item.catId || '',
                    subCatId: item.subCatId || '',
                    brandId: item.brandId || '',
                    styleId: item.styleId || '',
                    sizeId: item.sizeId || '',
                    colorId: item.colorId || '',
                    desId: item.desId || '',
                    uomId: item.uomId || '',
                    scanned: item.sQty.toFixed(decimalPrecision),
                    short: item.shortage.toFixed(decimalPrecision),
                    excess: item.excess.toFixed(decimalPrecision),
                    oemcode: item.oemcode || '',
                    t: item.t || '',
                    rdate: currentdate,
                })),
                xmlData: {
                    transNo: '',
                    sMcode: (salesman.match(/\((\d+)\)$/)?.[1]) || '',
                    transDate: currentdate,
                    rack: rack || '',
                    remarks: remarks || '',
                },
            };
            console.log(payload);
            console.log(JSON.stringify(payload, null, 2));
            const response = await axios.post(
                `${API_URL}/api/StockVerifyEntry/api/V1/SaveStockVerify`,
                payload
            );
            ToastAndroid.show(`${response.data}`, ToastAndroid.LONG);
            setSalesman('');
            setRack('');
            setRemarks('');
            setItemCode('');
            setStockItems([]);
            setQtyTotal(0);
            setSQtyTotal(0);
            setShortageTotal(0);
            setExcessTotal(0);
            setDecimalPrecision(2);
            focusItemCodeInput();
        } catch (error) {
            console.error('Error saving stock verification:', error);
            Alert.alert('Failed', 'Failed to save stock verification.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClear = () => {
        Alert.alert('Clear All Data?', 'Reset all fields?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'OK',
                onPress: () => {
                    setSalesman('');
                    setRack('');
                    setRemarks('');
                    setItemCode('');
                    setStockItems([]);
                    setQtyTotal(0);
                    setSQtyTotal(0);
                    setShortageTotal(0);
                    setExcessTotal(0);
                    setDecimalPrecision(2);
                    focusItemCodeInput();
                },
            },
        ]);
    };

    const handleBarcodeScan = (scannedCode: string) => {
        if (!salesman) {
            ToastAndroid.show('Select a salesman first.', ToastAndroid.SHORT);
            setShowScanner(false);
            return;
        }
        setItemCode(scannedCode);
        // setShowScanner(false);
        fetchItemDetails(scannedCode);
        focusItemCodeInput();
    };

    // const handleItemCodeSubmit = () => {
    //     if (!salesman) {
    //         ToastAndroid.show('Select a salesman first.', ToastAndroid.SHORT);
    //         return;
    //     }
    //     if (itemCode.length >= 1) fetchItemDetails(itemCode);
    //     // else ToastAndroid.show('Enter a valid Item/OEM code (min 1 chars).', ToastAndroid.SHORT);
    // };

    const handleItemCodeSubmit = () => {
        if (!salesman) {
            ToastAndroid.show('Select a salesman first.', ToastAndroid.SHORT);
            return;
        }
        if (!itemCode || itemCode.length < 1) {
            ToastAndroid.show('Enter a valid Item/OEM code.', ToastAndroid.SHORT);
            return;
        }
        fetchItemDetails(itemCode);
    };

    const handleRowPress = (index: number) => {
        if (stockItems[index].categorytype === 'L') {
            setSelectedItemIndex(index);
            setSQtyInput('');
            setShowSQtyModal(true);
        }
    };

    const handleRowLongPress = (index: number) => {
        Alert.alert(`Delete Item "${stockItems[index].itemCode}"?`, '', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'OK',
                onPress: () => {
                    setStockItems((prevItems) => {
                        const updatedItems = prevItems.filter((_, i) => i !== index);
                        setQtyTotal(parseFloat(updatedItems.reduce((sum, item) => sum + item.qty, 0).toFixed(decimalPrecision)));
                        setSQtyTotal(parseFloat(updatedItems.reduce((sum, item) => sum + item.sQty, 0).toFixed(decimalPrecision)));
                        setShortageTotal(parseFloat(updatedItems.reduce((sum, item) => sum + item.shortage, 0).toFixed(decimalPrecision)));
                        setExcessTotal(parseFloat(updatedItems.reduce((sum, item) => sum + item.excess, 0).toFixed(decimalPrecision)));
                        return updatedItems;
                    });
                    ToastAndroid.show('Item deleted.', ToastAndroid.SHORT);
                    focusItemCodeInput();
                },
            },
        ]);
    };

    const handleSQtySubmit = () => {
        const sQty = parseFloat(sQtyInput);
        if (isNaN(sQty) || sQty < 0) {
            ToastAndroid.show('Enter a valid quantity.', ToastAndroid.SHORT);
            return;
        }
        setStockItems((prevItems) => {
            const updatedItems = [...prevItems];
            if (selectedItemIndex !== null) {
                const curQty = updatedItems[selectedItemIndex].qty;
                const formattedSQty = parseFloat(sQty.toFixed(decimalPrecision));
                let shortage = curQty >= formattedSQty ? parseFloat((curQty - formattedSQty).toFixed(decimalPrecision)) : 0;
                let excess = curQty < formattedSQty ? parseFloat((formattedSQty - curQty).toFixed(decimalPrecision)) : 0;
                updatedItems[selectedItemIndex] = {
                    ...updatedItems[selectedItemIndex],
                    sQty: formattedSQty,
                    shortage,
                    excess,
                    t: curQty >= formattedSQty ? 'S' : 'E',
                    isHighlighted: true,
                };
                setQtyTotal(parseFloat(updatedItems.reduce((sum, item) => sum + item.qty, 0).toFixed(decimalPrecision)));
                setSQtyTotal(parseFloat(updatedItems.reduce((sum, item) => sum + item.sQty, 0).toFixed(decimalPrecision)));
                setShortageTotal(parseFloat(updatedItems.reduce((sum, item) => sum + item.shortage, 0).toFixed(decimalPrecision)));
                setExcessTotal(parseFloat(updatedItems.reduce((sum, item) => sum + item.excess, 0).toFixed(decimalPrecision)));
            }
            return updatedItems;
        });
        setShowSQtyModal(false);
        setSQtyInput('');
        setSelectedItemIndex(null);
        focusItemCodeInput();
    };

    const handleRowTouchStart = (index: number) => setHoveredIndex(index);
    const handleRowTouchEnd = () => setHoveredIndex(null);

    const filteredSalesmen = salesmenList.filter(
        (sm) =>
            sm.smId.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
            sm.smName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const calculateColumnWidths = () => {
        const defaultWidths = {
            itemCode: 130,
            itemName: 150,
            mrp: 80,
            qty: 80,
            sQty: 80,
            shortage: 80,
            excess: 80,
        };
        const maxWidths = stockItems.reduce((widths, item) => ({
            itemCode: Math.max(widths.itemCode, item.itemCode.length * 8),
            itemName: Math.max(widths.itemName, item.itemName.length * 8, 150),
            mrp: Math.max(widths.mrp, item.mrp.toString().length * 10),
            qty: Math.max(widths.qty, item.qty.toString().length * 10),
            sQty: Math.max(widths.sQty, item.sQty.toString().length * 10),
            shortage: Math.max(widths.shortage, item.shortage.toString().length * 10),
            excess: Math.max(widths.excess, item.excess.toString().length * 10),
        }), defaultWidths);
        return {
            itemCode: Math.min(maxWidths.itemCode, 150),
            itemName: Math.min(maxWidths.itemName, 200),
            mrp: Math.min(maxWidths.mrp, 100),
            qty: Math.min(maxWidths.qty, 100),
            sQty: Math.min(maxWidths.sQty, 100),
            shortage: Math.min(maxWidths.shortage, 100),
            excess: Math.min(maxWidths.excess, 100),
        };
    };

    const columnWidths = calculateColumnWidths();

    return (
        <View style={styles.container}>
            {isLoading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#2E7D32" />
                </View>
            )}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Stock Verify</Text>
                <View style={styles.headerButtons}>
                    <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                        <Icon name="save" size={35} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
                        <Text style={styles.clearText}>CLEAR</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={[styles.inputContainer, isLandscape && styles.inputContainerLandscape]}>
                <View style={[styles.inputRow, isLandscape && styles.inputRowLandscape]}>
                    <View style={[styles.inputWrapper, { flex: 1.7 }]}>
                        <TextInput
                            style={[styles.input, isLandscape && styles.inputLandscape]}
                            value={salesman}
                            onChangeText={setSalesman}
                            placeholder="Enter Salesman"
                            placeholderTextColor="#BDBDBD"
                        />
                        <TouchableOpacity
                            onPress={() => {
                                fetchSalesMenList();
                                setShowSalesmanModal(true);
                            }}
                            style={styles.cameraButton}
                        >
                            <Icon name="search" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    <View style={[styles.inputWrapper, { flex: 0.6 }]}>
                        <TextInput
                            style={[styles.input, isLandscape && styles.inputLandscape]}
                            value={rack}
                            onChangeText={setRack}
                            placeholder="Rack No."
                            placeholderTextColor="#BDBDBD"
                        />
                    </View>
                </View>
                <View style={[styles.inputRow, isLandscape && styles.inputRowLandscape]}>
                    <View style={[styles.inputWrapper, { flex: 1.7 }]}>
                        {/*  <TextInput
                            ref={itemCodeInputRef}
                            style={[styles.input, isLandscape && styles.inputLandscape]}
                            value={itemCode}
                            onChangeText={setItemCode}
                            onSubmitEditing={handleItemCodeSubmit}
                            placeholder="Enter Item/OEM Code"
                            placeholderTextColor="#BDBDBD"
                            keyboardType="default"
                            returnKeyType="done"
                        /> */}
                        <TextInput
                            ref={itemCodeInputRef}
                            style={[styles.input, isLandscape && styles.inputLandscape]}
                            value={itemCode}
                            onChangeText={(text) => {
                                const cleanedText = text.replace(/[\n\r]/g, '').trim();
                                setItemCode(cleanedText);
                            }}
                            onSubmitEditing={handleItemCodeSubmit}
                            onKeyPress={(event) => {
                                const key = event.nativeEvent.key;
                                console.log('Key pressed:', key);
                                if (key === 'ContextMenu' || key === 'Menu' || key === 'Unidentified') {
                                    event.preventDefault();
                                }
                            }}
                            placeholder="Enter Item/OEM Code"
                            placeholderTextColor="#BDBDBD"
                            keyboardType="default"
                            returnKeyType="done"
                            blurOnSubmit={false}
                            contextMenuHidden={true}
                            selectTextOnFocus={false}
                        />
                        <TouchableOpacity
                            onPress={() => {
                                if (!salesman) {
                                    ToastAndroid.show('Select a salesman first.', ToastAndroid.SHORT);
                                    return;
                                }
                                setShowScanner(true);
                            }}
                            style={styles.cameraButton}
                        >
                            <Icon name="photo-camera" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    <View style={[styles.inputWrapper, { flex: 0.6 }]}>
                        <TextInput
                            style={[styles.input, isLandscape && styles.inputLandscape]}
                            value={remarks}
                            onChangeText={setRemarks}
                            placeholder="Remarks"
                            placeholderTextColor="#BDBDBD"
                        />
                    </View>
                </View>
            </View>

            {salesman && stockItems.length > 0 && (
                <View style={styles.tableOuterContainer}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={true}
                        contentContainerStyle={{
                            minWidth: Object.values(columnWidths).reduce((a, b) => a + b, 0),
                        }}
                    >
                        <View>
                            <View style={styles.tableHeaderFixed}>
                                <View style={[styles.tableHeaderCell, { width: columnWidths.itemCode }]}>
                                    <Text style={styles.tableHeaderText}>Item Code</Text>
                                </View>
                                <View style={[styles.tableHeaderCell, { width: columnWidths.qty }]}>
                                    <Text style={styles.tableHeaderText}>CurQty</Text>
                                </View>
                                <View style={[styles.tableHeaderCell, { width: columnWidths.sQty }]}>
                                    <Text style={styles.tableHeaderText}>SQty</Text>
                                </View>
                                <View style={[styles.tableHeaderCell, { width: columnWidths.itemName }]}>
                                    <Text style={styles.tableHeaderText}>Item Name</Text>
                                </View>
                                <View style={[styles.tableHeaderCell, { width: columnWidths.itemName }]}>
                                    <Text style={styles.tableHeaderText}>Oem Code</Text>
                                </View>
                                <View style={[styles.tableHeaderCell, { width: columnWidths.mrp }]}>
                                    <Text style={styles.tableHeaderText}>MRP</Text>
                                </View>
                                <View style={[styles.tableHeaderCell, { width: columnWidths.shortage }]}>
                                    <Text style={styles.tableHeaderText}>Shortage</Text>
                                </View>
                                <View style={[styles.tableHeaderCell, { width: columnWidths.excess }]}>
                                    <Text style={styles.tableHeaderText}>Excess</Text>
                                </View>
                            </View>

                            <ScrollView
                                style={styles.tableDataContainer}
                                showsVerticalScrollIndicator={true}
                                ref={scrollViewRef}
                            >
                                {stockItems.map((item, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        onPress={() => item.categorytype === 'L' && handleRowPress(index)}
                                        onLongPress={() => handleRowLongPress(index)}
                                        onPressIn={() => handleRowTouchStart(index)}
                                        onPressOut={handleRowTouchEnd}
                                        style={[
                                            styles.tableRow,
                                            item.categorytype === 'L' && styles.clickableRow,
                                            item.isHighlighted && styles.highlightedRow,
                                            hoveredIndex === index && styles.hoveredRow,
                                        ]}
                                    >
                                        <View style={[styles.tableCellContainer, { width: columnWidths.itemCode }]}>
                                            <Text style={styles.tableCellText}>{item.itemCode}</Text>
                                        </View>
                                        <View style={[styles.tableCellContainer, { width: columnWidths.qty }]}>
                                            <Text style={styles.tableCellText}>{item.qty.toFixed(decimalPrecision)}</Text>
                                        </View>
                                        <View style={[styles.tableCellContainer, { width: columnWidths.sQty }]}>
                                            <Text style={styles.tableCellText}>{item.sQty.toFixed(decimalPrecision)}</Text>
                                        </View>
                                        <View style={[styles.tableCellContainer, { width: columnWidths.itemName }]}>
                                            <Text style={styles.tableCellText} numberOfLines={2} ellipsizeMode="tail">
                                                {item.itemName}
                                            </Text>
                                        </View>
                                        <View style={[styles.tableCellContainer, { width: columnWidths.itemName }]}>
                                            <Text style={styles.tableCellText} numberOfLines={2} ellipsizeMode="tail">
                                                {item.oemcode}
                                            </Text>
                                        </View>
                                        <View style={[styles.tableCellContainer, { width: columnWidths.mrp }]}>
                                            <Text style={styles.tableCellText}>{item.mrp.toFixed(decimalPrecision)}</Text>
                                        </View>
                                        <View style={[styles.tableCellContainer, { width: columnWidths.shortage }]}>
                                            <Text style={[styles.tableCellText, item.shortage > 0 && { color: '#D32F2F' }]}>
                                                {item.shortage.toFixed(decimalPrecision)}
                                            </Text>
                                        </View>
                                        <View style={[styles.tableCellContainer, { width: columnWidths.excess }]}>
                                            <Text style={[styles.tableCellText, item.excess > 0 && { color: '#2E7D32' }]}>
                                                {item.excess.toFixed(decimalPrecision)}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </ScrollView>
                </View>
            )}

            {salesman && stockItems.length > 0 && (
                <View style={[styles.summaryContainer, isLandscape && styles.summaryContainerLandscape]}>
                    <View style={[styles.summaryRow, isLandscape && styles.summaryRowLandscape]}>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryText}>Total Qty</Text>
                            <Text style={styles.summaryValue}>{qtyTotal.toFixed(decimalPrecision)}</Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryText}>Total SQty</Text>
                            <Text style={styles.summaryValue}>{sQtyTotal.toFixed(decimalPrecision)}</Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryText}>Shortage</Text>
                            <Text style={styles.summaryValue}>{shortageTotal.toFixed(decimalPrecision)}</Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryText}>Excess</Text>
                            <Text style={styles.summaryValue}>{excessTotal.toFixed(decimalPrecision)}</Text>
                        </View>
                    </View>
                </View>
            )}

            {showScanner && (
                <Modal
                    visible={showScanner}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setShowScanner(false)}
                >
                    <View style={styles.scannerModal}>
                        <BarcodeScanner
                            visible={showScanner}
                            onScan={handleBarcodeScan}
                            onClose={() => setShowScanner(false)}
                        />
                    </View>
                </Modal>
            )}

            {showSalesmanModal && (
                <Modal
                    visible={showSalesmanModal}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => {
                        setShowSalesmanModal(false);
                        setSearchQuery('');
                    }}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalBox, isLandscape && styles.modalBoxLandscape]}>
                            <Text style={styles.modalTitle}>Select Salesman</Text>
                            <TextInput
                                style={styles.searchInput}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                placeholder="Search by ID or Name"
                                placeholderTextColor="#BDBDBD"
                                autoFocus={true}
                            />
                            <View style={styles.salesmanHeaderRow}>
                                <Text style={styles.salesmanHeaderText}>SM ID</Text>
                                <Text style={styles.salesmanHeaderText}>SM Name</Text>
                            </View>
                            <ScrollView style={styles.salesmanList}>
                                {filteredSalesmen.length > 0 ? (
                                    filteredSalesmen.map((sm, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            onPress={() => {
                                                setSalesman(`${sm.smName} (${sm.smId})`);
                                                setShowSalesmanModal(false);
                                                setSearchQuery('');
                                            }}
                                            style={styles.salesmanRow}
                                        >
                                            <Text style={styles.salesmanText}>{sm.smId}</Text>
                                            <Text style={styles.salesmanText}>{sm.smName}</Text>
                                        </TouchableOpacity>
                                    ))
                                ) : (
                                    <Text style={styles.noResultsText}>No salesmen found</Text>
                                )}
                            </ScrollView>
                            <TouchableOpacity
                                onPress={() => {
                                    setShowSalesmanModal(false);
                                    setSearchQuery('');
                                }}
                                style={styles.closeButton}
                            >
                                <Text style={styles.closeButtonText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            )}

            {showSQtyModal && (
                <Modal
                    visible={showSQtyModal}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowSQtyModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalBox, isLandscape && styles.modalBoxLandscape]}>
                            <Text style={styles.modalTitle}>Enter Scanned Quantity</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={sQtyInput}
                                onChangeText={setSQtyInput}
                                placeholder="Enter SQty"
                                placeholderTextColor="#BDBDBD"
                                keyboardType="numeric"
                                autoFocus={true}
                            />
                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    onPress={() => setShowSQtyModal(false)}
                                    style={styles.modalCancelButton}
                                >
                                    <Text style={styles.modalCancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleSQtySubmit}
                                    style={styles.modalOkButton}
                                >
                                    <Text style={styles.modalOkText}>OK</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            )}

            {showItemSelectionModal && (
                <Modal
                    visible={showItemSelectionModal}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => {
                        setShowItemSelectionModal(false);
                        setItemList([]);
                    }}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalBox, isLandscape && styles.modalBoxLandscape]}>
                            <Text style={styles.modalTitle}>Select Item</Text>
                            <View style={styles.salesmanHeaderRow}>
                                <Text style={styles.salesmanHeaderText}>Item Code</Text>
                                <Text style={styles.salesmanHeaderText}>Item Name</Text>
                                <Text style={styles.salesmanHeaderText}>Qty</Text>
                                <Text style={styles.salesmanHeaderText}>MRP</Text>
                            </View>
                            <ScrollView style={styles.salesmanList}>
                                {itemList.length > 0 ? (
                                    itemList.map((item, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            onPress={() => handleItemSelection(item)}
                                            style={styles.salesmanRow}
                                        >
                                            <Text style={styles.salesmanText}>{item.itemcode}</Text>
                                            <Text style={styles.salesmanText}>{item.ItemDesc}</Text>
                                            <Text style={styles.salesmanText}>{item.Curqty}</Text>
                                            <Text style={styles.salesmanText}>{item.Rate}</Text>
                                        </TouchableOpacity>
                                    ))
                                ) : (
                                    <Text style={styles.noResultsText}>No items found</Text>
                                )}
                            </ScrollView>
                            <TouchableOpacity
                                onPress={() => {
                                    setShowItemSelectionModal(false);
                                    setItemList([]);
                                    focusItemCodeInput();
                                }}
                                style={styles.closeButton}
                            >
                                <Text style={styles.closeButtonText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#2E7D32',
        padding: 12,
        paddingTop: 20,
        elevation: 4,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 25,
        fontWeight: 'bold',
        textAlign: 'center',
        flex: 1,
    },
    headerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    saveButton: {
        padding: 8,
        marginRight: 8,
    },
    clearButton: {
        padding: 8,
    },
    clearText: {
        color: '#fff',
        fontWeight: '600',
    },
    inputContainer: {
        padding: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    inputContainerLandscape: {
        padding: 8,
    },
    inputRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    inputRowLandscape: {
        marginBottom: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 4,
    },
    input: {
        flex: 1,
        height: 45,
        borderColor: '#B0BEC5',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        backgroundColor: '#FAFAFA',
        fontSize: 16,
        color: '#424242',
    },
    inputLandscape: {
        height: 35,
        fontSize: 14,
    },
    cameraButton: {
        marginLeft: 8,
        backgroundColor: '#2E7D32',
        padding: 10,
        borderRadius: 8,
    },
    tableOuterContainer: {
        flex: 1,
        marginHorizontal: 12,
        marginTop: 12,
        minHeight: 200,
        maxHeight: '60%',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
    },
    tableHeaderFixed: {
        flexDirection: 'row',
        backgroundColor: '#388E3C',
        paddingVertical: 12,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
    },
    tableHeaderCell: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    tableHeaderText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    tableDataContainer: {
        flex: 1,
    },
    tableRow: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        minHeight: 80,
        alignItems: 'center',
    },
    tableCellContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    tableCellText: {
        color: '#424242',
        fontSize: 14,
        textAlign: 'center',
    },
    clickableRow: {
        backgroundColor: '#E8F5E9',
    },
    highlightedRow: {
        backgroundColor: '#FFF9C4',
    },
    hoveredRow: {
        backgroundColor: '#F0F0F0',
    },
    summaryContainer: {
        backgroundColor: '#FFFFFF',
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    summaryContainerLandscape: {
        padding: 8,
    },
    summaryRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    summaryRowLandscape: {
        justifyContent: 'space-evenly',
    },
    summaryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 8,
    },
    summaryText: {
        fontSize: 14,
        color: '#424242',
        fontWeight: '600',
    },
    summaryValue: {
        fontSize: 14,
        color: '#2E7D32',
        fontWeight: '700',
        marginLeft: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBox: {
        width: '90%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        elevation: 5,
    },
    modalBoxLandscape: {
        width: '60%',
        padding: 15,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
        color: '#000',
    },
    modalInput: {
        height: 45,
        borderColor: '#B0BEC5',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        backgroundColor: '#FAFAFA',
        fontSize: 16,
        color: '#424242',
        marginBottom: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalCancelButton: {
        backgroundColor: '#ff7f7f',
        padding: 10,
        borderRadius: 8,
        flex: 1,
        marginRight: 8,
        alignItems: 'center',
    },
    modalCancelText: {
        color: '#fff',
        fontWeight: '600',
    },
    modalOkButton: {
        backgroundColor: '#2E7D32',
        padding: 10,
        borderRadius: 8,
        flex: 1,
        marginLeft: 8,
        alignItems: 'center',
    },
    modalOkText: {
        color: '#fff',
        fontWeight: '600',
    },
    salesmanRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    salesmanText: {
        fontSize: 14,
        color: '#424242',
        flex: 1,
        textAlign: 'center',
    },
    closeButton: {
        backgroundColor: '#2E7D32',
        marginTop: 12,
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    closeButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    salesmanHeaderRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#B0BEC5',
        paddingBottom: 6,
        marginBottom: 6,
    },
    salesmanHeaderText: {
        flex: 1,
        fontWeight: '700',
        fontSize: 14,
        color: '#2E7D32',
        textAlign: 'center',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    searchInput: {
        height: 45,
        borderColor: '#B0BEC5',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        backgroundColor: '#FAFAFA',
        fontSize: 16,
        color: '#424242',
        marginBottom: 12,
    },
    salesmanList: {
        maxHeight: 200,
    },
    noResultsText: {
        fontSize: 14,
        color: '#424242',
        textAlign: 'center',
        marginTop: 20,
    },
    scannerModal: {
        flex: 1,
        width: '50%',
        height: '50%',
        alignItems: 'center',
        justifyContent: 'center',
        left: '25%',
    },
});

export default StockVerify;