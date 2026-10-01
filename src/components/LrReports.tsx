import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  FlatList,
  Button,
  StyleSheet,
  Dimensions,
  Alert,
  BackHandler,
  ActivityIndicator,
  ToastAndroid,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import ImageViewer from "react-native-image-zoom-viewer";
import { Calendar } from "react-native-calendars";
import axios from "axios";
import { useApi } from "./APIcontext.tsx";

interface ReportItem {
  id: string;
  lrId: string;
  lrGrNo: string;
  desc6: string | null; // Allow desc6 to be null
  isImageLoading?: boolean;
  hasImageError?: boolean; // Track if image failed to load
}

interface LRReortscreenprop {
  onBack: () => void;
}

const getCurrentDate = () => {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const year = today.getFullYear();
  return `${day}-${month}-${year}`;
};

const LRReportScreen: React.FC<LRReortscreenprop> = ({ onBack }) => {
  const [fromDate, setFromDate] = useState(getCurrentDate());
  const [toDate, setToDate] = useState(getCurrentDate());
  const [showFromCalendar, setShowFromCalendar] = useState(false);
  const [showToCalendar, setShowToCalendar] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string }[]>([]);
  const [allData, setAllData] = useState<ReportItem[]>([]);
  const [filteredData, setFilteredData] = useState<ReportItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { API_URL, updateApiUrl } = useApi();
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);

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

    setIsMounted(true);

    return () => backHandler.remove();
  }, [onBack]);

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split("-");
    return `${day}-${month}-${year}`;
  };

  const openImage = (imageUrl: string) => {
    if (imageUrl) {
      setSelectedImage([{ url: imageUrl }]);
      setModalVisible(true);
    }
  };

  const GetImage = (imageUrl: string | null): string | null => {
    if (!imageUrl || typeof imageUrl !== "string" || imageUrl.trim() === "") {
      console.log("Invalid imageUrl, using fallback:", imageUrl);
      return null; // Return null for invalid URLs
    }
    const baseURL = `${API_URL}/ProtectedUplodFiles`;
    const fileName = imageUrl.split("\\").pop();
    if (!fileName) {
      console.log("Invalid file name extracted from imageUrl:", imageUrl);
      return null;
    }
    const timestamp = new Date().getTime();
    return `${baseURL}/${fileName}?t=${timestamp}`;
  };

  const paginateData = (data: ReportItem[], page: number, itemsPerPage: number): ReportItem[] => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(allData.length / itemsPerPage);

  const loadData = async () => {
    if (!fromDate) {
      showToast("Please Select From Date");
      return;
    }
    if (!toDate) {
      showToast("Please Select To Date");
      return;
    }

    setAllData([]);
    setFilteredData([]);
    setCurrentPage(1);
    setIsLoading(true);

    const url = `${API_URL}/api/LRReceipt/LRReportScan`;
    console.log("Fetching from URL:", `${url}?FromDate=${fromDate}&ToDate=${toDate}`);

    try {
      const response = await axios.get(url, {
        params: { FromDate: fromDate, ToDate: toDate },
      });

      const responseData = response.data?.[0]?.[0] || [];
      const data = Array.isArray(responseData) ? responseData : [];

      if (data.length > 0) {
        const formattedData: ReportItem[] = data.map((item: any, index: number) => ({
          id: index.toString(),
          lrId: item.LRId,
          lrGrNo: item["LRGRNo"],
          desc6: GetImage(item.Desc6),
          isImageLoading: !!GetImage(item.Desc6), // Set loading only if image URL is valid
          hasImageError: false, // Initialize with no error
        }));

        setAllData(formattedData);
        setFilteredData(paginateData(formattedData, 1, itemsPerPage));
        setCurrentPage(1);
      } else {
        showToast("No data available for the selected date range.");
        setAllData([]);
        setFilteredData([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      if (axios.isAxiosError(error)) {
        showToast(`Failed to load data: ${error.message}`);
      } else {
        showToast("An unknown error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateImageLoadingState = (itemId: string, isLoading: boolean) => {
    setAllData((prevData) =>
      prevData.map((item) =>
        item.id === itemId ? { ...item, isImageLoading: isLoading } : item
      )
    );
    setFilteredData((prevData) =>
      prevData.map((item) =>
        item.id === itemId ? { ...item, isImageLoading: isLoading } : item
      )
    );
  };

  const updateImageErrorState = (itemId: string) => {
    setAllData((prevData) =>
      prevData.map((item) =>
        item.id === itemId ? { ...item, hasImageError: true, isImageLoading: false } : item
      )
    );
    setFilteredData((prevData) =>
      prevData.map((item) =>
        item.id === itemId ? { ...item, hasImageError: true, isImageLoading: false } : item
      )
    );
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    setFilteredData(paginateData(allData, page, itemsPerPage));
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
    setFilteredData(paginateData(allData, 1, value));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>LR/GR Report Scan Image</Text>
      </View>

      <View style={styles.dateContainer}>
        <View style={styles.datePicker}>
          <Text style={styles.dateheader}>From Date:</Text>
          <Button title={` ${fromDate || "Select"}`} onPress={() => setShowFromCalendar(true)} />
          {showFromCalendar && (
            <Modal transparent={true} animationType="slide">
              <View style={styles.calendarModal}>
                <Calendar
                  onDayPress={(day: { dateString: string }) => {
                    setFromDate(formatDate(day.dateString));
                    setShowFromCalendar(false);
                    setShowToCalendar(true);
                  }}
                  markedDates={{ [fromDate]: { selected: true, selectedColor: "blue" } }}
                />
                <Button title="Close" onPress={() => setShowFromCalendar(false)} />
              </View>
            </Modal>
          )}
        </View>

        <View style={styles.datePicker}>
          <Text style={styles.dateheader}>To Date:</Text>
          <Button title={` ${toDate || "Select"}`} onPress={() => setShowToCalendar(true)} />
          {showToCalendar && (
            <Modal transparent={true} animationType="slide">
              <View style={styles.calendarModal}>
                <Calendar
                  onDayPress={(day: { dateString: string }) => {
                    setToDate(formatDate(day.dateString));
                    setShowToCalendar(false);
                  }}
                  markedDates={{ [toDate]: { selected: true, selectedColor: "blue" } }}
                />
                <Button title="Close" onPress={() => setShowToCalendar(false)} />
              </View>
            </Modal>
          )}
        </View>
      </View>

      <TouchableOpacity style={styles.loadDataButton} onPress={loadData} disabled={isLoading}>
        <Text style={styles.loadDataText}>
          {isLoading ? "Loading..." : "Load Data"}
        </Text>
      </TouchableOpacity>

      {isLoading ? (
        <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 20 }} />
      ) : (
        <>
          <FlatList
            data={filteredData}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
            renderItem={({ item }) => (
              <View style={styles.gridItem}>
                <View style={styles.leftContainer}>
                  <Text style={styles.textBold}>{item.lrId}</Text>
                  <Text style={styles.textNormal}>{item.lrGrNo}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => openImage(item.desc6!)}
                  style={styles.rightContainer}
                  disabled={!item.desc6 || item.hasImageError} // Disable touch if no image
                >
                  {!item.desc6 || item.hasImageError ? (
                    <View style={styles.noImageContainer}>
                      <Text style={styles.noImageText}>No Image</Text>
                    </View>
                  ) : (
                    <>
                      {item.isImageLoading && (
                        <ActivityIndicator
                          size="small"
                          color="#007bff"
                          style={styles.imageLoader}
                        />
                      )}
                      <Image
                        source={{ uri: item.desc6 }}
                        style={styles.image}
                        onLoadStart={() => updateImageLoadingState(item.id, true)}
                        onLoadEnd={() => updateImageLoadingState(item.id, false)}
                        onError={() => updateImageErrorState(item.id)}
                      />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          />

          {allData.length > 0 && (
            <View style={styles.paginationContainer}>
              {isMounted && (
                <Picker
                  selectedValue={itemsPerPage}
                  style={styles.picker}
                  onValueChange={(itemValue: number) => handleItemsPerPageChange(itemValue)}
                  mode="dropdown"
                >
                  <Picker.Item label="5" value={5} />
                  <Picker.Item label="10" value={10} />
                  <Picker.Item label="20" value={20} />
                  <Picker.Item label="30" value={30} />
                  <Picker.Item label="50" value={50} />
                </Picker>
              )}
              <TouchableOpacity
                style={[styles.pageButton, currentPage === 1 && styles.disabledButton]}
                onPress={() => handlePageChange(1)}
                disabled={currentPage === 1}
              >
                <Text style={styles.pageButtonText}>{'<<'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.pageButton, currentPage === 1 && styles.disabledButton]}
                onPress={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <Text style={styles.pageButtonText}>{'<'}</Text>
              </TouchableOpacity>

              <Text style={styles.pageInfo}>
                Page {currentPage} of {totalPages}
              </Text>

              <TouchableOpacity
                style={[styles.pageButton, currentPage === totalPages && styles.disabledButton]}
                onPress={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <Text style={styles.pageButtonText}>{'>'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.pageButton, currentPage === totalPages && styles.disabledButton]}
                onPress={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
              >
                <Text style={styles.pageButtonText}>{'>>'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      <Modal visible={modalVisible} transparent={true} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
            <Text style={styles.closeText}>✖</Text>
          </TouchableOpacity>
          <ImageViewer imageUrls={selectedImage} enableSwipeDown={true} />
        </View>
      </Modal>
    </View>
  );
};

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // padding: 10,
    backgroundColor: "#f5f5f5",
    paddingTop:5,
  },
  header: {
    fontSize: 24,
    color:'white',
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 20,
    // textDecorationLine: "underline",
      // marginVertical: 15,
      width: '100%',
      // backgroundColor: '#3949AB',
      backgroundColor: '#4CAF50',
      padding: 5,
      // alignItems: 'center',
      marginBottom: 20,
  },
  headerText: {
    fontSize: 20,
    color:'white',
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 20,
    // textDecorationLine: "underline",
  },
  dateContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  datePicker: {
    flex: 1,
    marginHorizontal: 5,
  },
  dateheader: {
    fontSize: 16,
    fontStyle: "normal",
    fontWeight: "600",
  },
  loadDataButton: {
    alignSelf: "flex-end",
    backgroundColor: "#007bff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginVertical: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  loadDataText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  calendarModal: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  gridItem: {
    flexDirection: "row",
    padding: 10,
    borderBottomWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    marginVertical: 5,
    elevation: 2,
  },
  leftContainer: {
    width: "40%",
    paddingRight: 10,
  },
  textBold: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  textNormal: {
    fontSize: 14,
    color: "#555",
  },
  rightContainer: {
    width: "60%",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: 100,
    borderRadius: 10,
    resizeMode: "contain",
    backgroundColor: "#eee",
  },
  imageLoader: {
    position: "absolute",
    zIndex: 1,
  },
  noImageContainer: {
    width: "100%",
    height: 100,
    borderRadius: 10,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
  },
  noImageText: {
    fontSize: 14,
    color: "#555",
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 2,
  },
  closeText: {
    color: "#fff",
    backgroundColor: "#000",
    fontSize: 20,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 5,
    marginVertical: 10,
  },
  pageButton: {
    backgroundColor: "#007bff",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  disabledButton: {
    backgroundColor: "#cccccc",
  },
  pageButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  pageInfo: {
    fontSize: 14,
    color: "#333",
  },
  picker: {
    height: 50,
    width: 85,
    color: "#000",
    backgroundColor: "white",
  },
});

export default LRReportScreen;