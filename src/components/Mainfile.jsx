import React, { useState, useEffect } from 'react';
import { View, Alert, StyleSheet, TouchableOpacity, Image, Text, LogBox, ScrollView, Dimensions, BackHandler, StatusBar } from 'react-native';
import MenuDrawer from 'react-native-side-drawer';
import IncomingLogisticsScreen1 from './incominglr.tsx';
import IncomingLogisticsScreen2 from './incominglrshort.tsx';
import OpenBale from './openbale.tsx';
import LRReportScreen from './LrReports.tsx';
import StockTransfer from '../components/StockTransfermain.tsx';
import Stockscreen from '../components/StockTransfer.tsx';
import InWardStock from '../components/Inwardstock.tsx';
import InWardStockIC from '../components/InWardStock(IC).tsx';
import StockVerify from '../components/StockVerify.tsx';
import Franchisetransfer from '../components/Franchise.jsx'
import { ApiProvider } from './APIcontext';
import retailcliq from '../components/assests/retailcliqnew.png';
import LRicon from '../components/assests/LRimage.png';
import icon1 from '../components/assests/Truck_2.png';
import icon2 from '../components/assests/Truck.png';
import Stockicon from '../components/assests/Stock.png';
import Stockicon2 from '../components/assests/stock_Inward.png';
import icon3 from '../components/assests/container.png';
import menuIcon from '../components/assests/Menuicon.png';
import UrlModal from './usesetting.tsx';
import Logout from '../components/assests/power-on.png';
import CircularIcon from '../components/CircularIcon.tsx';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useApi } from './APIcontext';
import AsyncStorage from '@react-native-async-storage/async-storage';

LogBox.ignoreLogs(['MenuDrawer: Support for defaultProps will be removed from function components in a future major release. Use JavaScript default parameters instead.']);

const DrawerComponent = ({ children, menuOpen = false, drawerContent, toggleMenu }) => {
  return (
    <View style={{ flex: 1 }}>
      <MenuDrawer
        open={menuOpen}
        drawerContent={drawerContent}
        drawerPercentage={60}
        animationTime={250}
        overlay={true}
        opacity={0.4}
      >
        {menuOpen && (
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={toggleMenu}
          />
        )}
        <View style={{ flex: 1 }}>{children}</View>
      </MenuDrawer>
    </View>
  );
};

const MainFile = ({ setAuth }) => {
  const [currentRoute, setCurrentRoute] = useState('Home');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isModalVisible, setModalVisible] = useState(true);
  const [lrManageExpanded, setLrManageExpanded] = useState(false);
  const [StocktransferExpanded, setStocktransferExpanded] = useState(false);
  const [orientation, setOrientation] = useState('portrait');
  const { unit, setUnit, setCounterId, setUserlevel } = useApi();


  console.log(unit);

  // const handleBack = () => {
  //   if (menuOpen === true) {
  //     setMenuOpen(false);
  //     return true;
  //   } else {
  //     setCurrentRoute('Home');
  //     return true;
  //   }
  // };

  const handleBack = () => {
    if (menuOpen) {
      setMenuOpen(false);
      return true;
    }
    if (currentRoute === 'Home') {
      handleLogout();
      return true;
    }

    setCurrentRoute('Home');
    return true;
  };

  // console.log(currentRoute);

  // const handleLogout = () => {
  //   Alert.alert(
  //     "Confirm Logout",
  //     "Are you sure you want to log out?",
  //     [
  //       {
  //         text: "Cancel",
  //         style: "cancel",
  //       },
  //       {
  //         text: "Logout",
  //         onPress: () => setAuth(false), 
  //       },
  //     ],
  //     { cancelable: true }
  //   );
  // };

  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove(['unit', 'counterId', 'userlevel']);
              setUnit('');
              setCounterId('');
              setUserlevel('0');
              setAuth(false);
            } catch (e) {
              console.error("Logout error:", e);
            }
          }
        }
      ]
    );
  };




  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
    setLrManageExpanded(false);
    setStocktransferExpanded(false);
  };

  const toggleLrManageExpand = () => {
    setLrManageExpanded(!lrManageExpanded);
  };

  const toggleStockTransfer = () => {
    setStocktransferExpanded(!StocktransferExpanded);
  };

  const navigateTo = (screen) => {
    setMenuOpen(false);
    setCurrentRoute(screen);
  };

  useEffect(() => {
    const updateOrientation = () => {
      const { width, height } = Dimensions.get('window');
      setOrientation(width > height ? 'landscape' : 'portrait');
    };

    updateOrientation();
    const subscription = Dimensions.addEventListener('change', updateOrientation);

    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBack);

    return () => {
      subscription.remove();
      backHandler.remove();
    };
  }, [menuOpen, currentRoute]);

  const watermarkStyle = {
    ...styles.watermark,
    width: orientation === 'portrait' ? '80%' : '30%',
    height: orientation === 'portrait' ? '85%' : '50%',
    top: orientation === 'portrait' ? '60%' : '75%',
    left: orientation === 'portrait' ? '23%' : '75%',
  };

  const renderScreen = () => {
    switch (currentRoute) {
      case 'Home':
        return (
          <ScrollView contentContainerStyle={styles.homeContainer}>
            <Image source={retailcliq} style={watermarkStyle} resizeMode="contain" />
            <View style={styles.header}>
              <Text style={styles.headerTitle}>LR Manage </Text>
            </View>

            <View style={styles.iconGrid}>
              <CircularIcon
                icon={LRicon}
                title="LR Manage"
                onPress={() => setCurrentRoute('LRManage')}
              />
              <CircularIcon
                icon={Stockicon}
                title="Stock Transfer"
                onPress={() => setCurrentRoute('StockTransfer')}
              />
            </View>

            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Image
                source={Logout}
                style={styles.logout}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </ScrollView>
        );
      case 'LRManage':
        return (
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <View style={styles.container}>
              <Image source={retailcliq} style={watermarkStyle} resizeMode="contain" />
              <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <Text style={styles.backButtonText}>← </Text>
              </TouchableOpacity>
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.screenTitle}>LR Manage Options</Text>
              </View>
              <View style={styles.iconGrid}>
                {/* <CircularIcon
                  icon={icon1}
                  title="Incoming Logistics"
                  onPress={() => setCurrentRoute('IncomingLogisticsScreen1')}
                /> */}
                <CircularIcon
                  icon={icon2}
                  title="Incoming Logistics Short"
                  onPress={() => setCurrentRoute('IncomingLogisticsScreen2')}
                />
                <CircularIcon
                  icon={icon3}
                  title="Open Bale Entry"
                  onPress={() => setCurrentRoute('OpenBale')}
                />
                <CircularIcon
                  icon={icon3}
                  title="LR/GR Report"
                  onPress={() => setCurrentRoute('LRReport')}
                />
              </View>
            </View>
          </ScrollView>
        );
      case 'StockTransfer':
        return (
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <View style={styles.container}>
              <Image source={retailcliq} style={watermarkStyle} resizeMode="contain" />
              <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <Text style={styles.backButtonText}>← </Text>
              </TouchableOpacity>
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.screenTitle}>Stock Transfer Options</Text>
              </View>
              <View style={styles.iconGrid}>
                {unit === 'Warehouse' ? (
                  <>
                    <CircularIcon
                      icon={Stockicon}
                      title="Stock Transfer"
                      onPress={() => setCurrentRoute('Stockscreen')}
                    />
                    <CircularIcon
                      icon={Stockicon2}
                      title="Stock Verify"
                      onPress={() => setCurrentRoute('Stockverify')}
                    />
                      <CircularIcon
                      icon={Stockicon}
                      title="Stock Transfer to Franchise/Branch"
                      onPress={() => setCurrentRoute('Stockfranchisescreen')}
                    />
                  </>
                ) : (
                  <>
                    {/* <CircularIcon
                      icon={Stockicon}
                      title="Stock Transfer"
                      onPress={() => setCurrentRoute('Stockscreen')}
                    /> */}
                    
                    <CircularIcon
                      icon={Stockicon}
                      title="InWard Stock"
                      onPress={() => setCurrentRoute('StockTransfermain')}
                    />
                    <CircularIcon
                      icon={Stockicon2}
                      title="Stock Verify"
                      onPress={() => setCurrentRoute('Stockverify')}
                    />
                      <CircularIcon
                      icon={Stockicon}
                      title="Stock Transfer to Franchise/Branch"
                      onPress={() => setCurrentRoute('Stockfranchisescreen')}
                    />
                  </>
                )}
              </View>
            </View>
          </ScrollView>
        );
      case 'IncomingLogisticsScreen1':
        return (
          <View style={styles.fullScreenContainer}>
            <IncomingLogisticsScreen1 onBack={() => setCurrentRoute('LRManage')} />
          </View>
        );
      case 'IncomingLogisticsScreen2':
        return (
          <View style={styles.fullScreenContainer}>
            <IncomingLogisticsScreen2 onBack={() => setCurrentRoute('LRManage')} />
          </View>
        );
      case 'OpenBale':
        return (
          <View style={styles.fullScreenContainer}>
            <OpenBale onBack={() => setCurrentRoute('LRManage')} />
          </View>
        );
      case 'LRReport':
        return (
          <View style={styles.fullScreenContainer}>
            <LRReportScreen onBack={() => setCurrentRoute('LRManage')} />
          </View>
        );
      case 'StockTransfermain':
        return (
          <View style={styles.fullScreenContainer}>
            <StockTransfer onBack={() => setCurrentRoute('StockTransfer')} />
          </View>
        );
      case 'Stockscreen':
        return (
          <View style={styles.fullScreenContainer}>
            <Stockscreen onBack={() => setCurrentRoute('StockTransfer')} />
          </View>
        );
      case 'InWardStock':
        return (
          <View style={styles.fullScreenContainer}>
            <InWardStock onBack={() => setCurrentRoute('StockTransfer')} />
          </View>
        );
      case 'InWardStockic':
        return (
          <View style={styles.fullScreenContainer}>
            <InWardStockIC onBack={() => setCurrentRoute('StockTransfer')} />
          </View>
        );
      case 'Stockfranchisescreen':
        return (
          <View style={styles.fullScreenContainer}>
            <Franchisetransfer onBack={() => setCurrentRoute('StockTransfer')} />
          </View>
        );
      case 'Stockverify':
        return (
          <View style={styles.fullScreenContainer}>
            <StockVerify onBack={() => setCurrentRoute('StockTransfer')} />
          </View>
        );
      case 'UrlModal':
        return (
          <View style={styles.fullScreenContainer}>
            <UrlModal isModalVisible={true} setModalVisible={setModalVisible} onBack={handleBack} />
          </View>
        );
      default:
        return null;
    }
  };

  const DrawerContent = (
    <View style={styles.drawerContent}>
      <TouchableOpacity onPress={toggleMenu} style={styles.closeButton}>
        <Icon name="menu" size={20} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigateTo('Home')} style={styles.menuItem}>
        <Text style={styles.menuText}>Home</Text>
      </TouchableOpacity>

      <View>
        <TouchableOpacity onPress={toggleLrManageExpand} style={styles.menuItem}>
          <View style={styles.menuItemWithIcon}>
            <Text style={styles.menuText}>LR Manage</Text>
            <Text style={styles.expandIcon}>{lrManageExpanded ? '▼' : '►'}</Text>
          </View>
        </TouchableOpacity>

        {lrManageExpanded && (
          <View style={styles.subMenuContainer}>
            {/* <TouchableOpacity
              onPress={() => navigateTo('IncomingLogisticsScreen1')}
              style={styles.subMenuItem}
            >
              <Text style={styles.subMenuText}>Incoming Logistics</Text>
            </TouchableOpacity> */}

            <TouchableOpacity
              onPress={() => navigateTo('IncomingLogisticsScreen2')}
              style={styles.subMenuItem}
            >
              <Text style={styles.subMenuText}>Incoming Logistics Short</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigateTo('OpenBale')}
              style={styles.subMenuItem}
            >
              <Text style={styles.subMenuText}>Open Bale Entry</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigateTo('LRReport')}
              style={styles.subMenuItem}
            >
              <Text style={styles.subMenuText}>LR Report Scan</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <TouchableOpacity onPress={toggleStockTransfer} style={styles.menuItem}>
        <View style={styles.menuItemWithIcon}>
          <Text style={styles.menuText}>StockTransfer</Text>
          <Text style={styles.expandIcon}>{StocktransferExpanded ? '▼' : '►'}</Text>
        </View>
      </TouchableOpacity>
      {StocktransferExpanded && (
        <View style={styles.subMenuContainer}>
          {unit === 'Warehouse' ? (
            <>
              <TouchableOpacity
                onPress={() => navigateTo('Stockscreen')}
                style={styles.subMenuItem}
              >
                <Text style={styles.subMenuText}>Stock Transfer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigateTo('Stockverify')}
                style={styles.subMenuItem}
              >
                <Text style={styles.subMenuText}>Stock Verify</Text>
              </TouchableOpacity>
                <TouchableOpacity
                onPress={() => navigateTo('Stockfranchisescreen')}
                style={styles.subMenuItem}
              >
                <Text style={styles.subMenuText}>Franchise Transfer</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                onPress={() => navigateTo('StockTransfermain')}
                style={styles.subMenuItem}
              >
                <Text style={styles.subMenuText}>Inward Stock</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigateTo('Stockverify')}
                style={styles.subMenuItem}
              >
                <Text style={styles.subMenuText}>Stock Verify</Text>
              </TouchableOpacity>
                <TouchableOpacity
                onPress={() => navigateTo('Stockfranchisescreen')}
                style={styles.subMenuItem}
              >
                <Text style={styles.subMenuText}>Franchise Transfer</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      <TouchableOpacity onPress={() => navigateTo('UrlModal')} style={styles.menuItem}>
        <Text style={styles.menuText}>Settings</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleLogout} style={styles.menuItem}>
        <Text style={styles.menuText}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Image source={retailcliq} style={styles.footerImage} resizeMode="contain" />
      </View>
    </View>
  );

  return (
    <ApiProvider>
      <View style={styles.mainContainer}>
        <DrawerComponent menuOpen={menuOpen} drawerContent={DrawerContent} toggleMenu={toggleMenu}>
          <View style={styles.menuIconContainer}>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
                <Icon
                  name="menu"
                  size={20}
                  color={currentRoute === 'Home' ? 'white' : currentRoute === 'StockTransfermain' ? 'white' : 'white'}
                  style={[
                    currentRoute === 'Home'
                      ? { backgroundColor: '#3949AB', padding: 5, borderRadius: 5 }
                      : {},
                    currentRoute === 'StockTransfermain'
                      ? { position: 'absolute', top: 80, }
                      : {}
                  ]}
                />
              </TouchableOpacity>
            </View>
          </View>
          {renderScreen()}
        </DrawerComponent>
      </View>
    </ApiProvider>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#F4F6F9',
    paddingTop: 20,
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#F4F6F9',
    width: '100%',
    height: '100%'
  },
  iconContainer: {
    width: '80%',
    paddingVertical: 15,
    paddingHorizontal: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    marginBottom: 20,
  },
  icon: {
    width: 100,
    height: 80,
    borderRadius: 15,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  iconname: {
    fontSize: 14,
    fontFamily: 'Times New Roman',
    fontWeight: '600',
    color: '#3949AB',
    textAlign: 'center',
    marginTop: 5,
  },
  watermark: {
    position: 'absolute',
    width: '80%',
    height: '85%',
    top: '60%',
    left: '23%',
    transform: [{ translateX: -0.5 * 100 }, { translateY: -0.5 * 100 }],
  },
  menuIconContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 20,
    top: 10,
    left: 20,
    zIndex: 999,
  },
  menuOne: {
    fontSize: 25,
    color: '#000',
    backgroundColor: 'white',
  },
  menutwo: {
    fontSize: 22,
    color: '#000',
  },
  drawerContent: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 30,
    justifyContent: 'flex-start',
  },
  closeButton: {
    borderRadius: 5,
    alignSelf: 'flex-end',
  },
  menuItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  menuText: {
    fontFamily: 'Times New Roman',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  menuItemWithIcon: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expandIcon: {
    fontSize: 16,
    color: '#333',
    marginRight: 5,
  },
  subMenuContainer: {
    marginLeft: 20,
    borderLeftWidth: 0.5,
    borderLeftColor: '#ddd',
  },
  subMenuItem: {
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ddd',
  },
  subMenuText: {
    fontFamily: 'Times New Roman',
    fontSize: -16,
    color: '#000',
  },
  menuButton: {
    top: 15,
    padding: 10,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 998,
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  footerImage: {
    width: Dimensions.get('window').width * 0.8,
    height: 60,
    opacity: 0.9,
    resizeMode: 'contain',
  },
  logoutButton: {
    position: 'absolute',
    top: 30,
    right: 10,
    zIndex: 1,
    justifyContent: 'center',
  },
  logout: {
    width: 30,
    height: 30,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    right: 10,
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'lightgray',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  backButtonText: {
    color: '#000',
    fontSize: 25,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 26,
    marginLeft: 3,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 30,
    fontFamily: 'Times New Roman',
    width: '100%',
    backgroundColor: '#4CAF50',
    padding: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  homeContainer: {
    flexGrow: 1,
    backgroundColor: '#F4F6F9',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
  },
  header: {
    width: '100%',
    backgroundColor: '#3949AB',
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    paddingLeft: 35,
  },
});

export default MainFile;