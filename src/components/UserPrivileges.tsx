import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

type PrivilegeKey =
  | 'stockExportToBranchLTWise'
  | 'stockExportToBranch'
  | 'stockReturnImportFromBranch'
  | 'stockReturnImportFromBranchItemWise'
  | 'stockTransferReportLTWise'
  | 'fileTransferFlow'
  | 'printBarcodeWhileStockTransfers'
  | 'format16_AGRCBarcodePrint'
  | 'format15_BTBarcodePrint'
  | 'stockImportFromWarehouseLTWise'
  | 'stockImportFromWarehousePacketWise'
  | 'stockImportFromWarehouseItemWise'
  | 'stockReturnToWarehouse'
  | 'userPrivilegesScreens'
  | 'warehouseDB'
  | 'syncAfterSave'
  | 'withScanQty';

// Custom Checkbox Component
const CustomCheckBox: React.FC<{
  checked: boolean;
  onPress: () => void;
  label: string;
}> = ({ checked, onPress, label }) => {
  return (
    <TouchableOpacity style={styles.checkboxRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Icon name="check" size={16} color="#FFFFFF" />}
      </View>
      <Text style={styles.checkboxLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

const UserPrivileges: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [user, setUser] = useState<string>('');
  const [privileges, setPrivileges] = useState<{
    [key in PrivilegeKey]: boolean;
  }>({
    stockExportToBranchLTWise: false,
    stockExportToBranch: false,
    stockReturnImportFromBranch: false,
    stockReturnImportFromBranchItemWise: false,
    stockTransferReportLTWise: false,
    fileTransferFlow: false,
    printBarcodeWhileStockTransfers: false,
    format16_AGRCBarcodePrint: false,
    format15_BTBarcodePrint: false,
    stockImportFromWarehouseLTWise: false,
    stockImportFromWarehousePacketWise: false,
    stockImportFromWarehouseItemWise: false,
    stockReturnToWarehouse: false,
    userPrivilegesScreens: false,
    warehouseDB: false,
    syncAfterSave: false,
    withScanQty: false,
  });

  const handleCheckboxChange = (key: PrivilegeKey) => {
    setPrivileges(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    console.log('Privileges saved:', { user, privileges });
  };

  const handleClear = () => {
    setUser('');
    setPrivileges({
      stockExportToBranchLTWise: false,
      stockExportToBranch: false,
      stockReturnImportFromBranch: false,
      stockReturnImportFromBranchItemWise: false,
      stockTransferReportLTWise: false,
      fileTransferFlow: false,
      printBarcodeWhileStockTransfers: false,
      format16_AGRCBarcodePrint: false,
      format15_BTBarcodePrint: false,
      stockImportFromWarehouseLTWise: false,
      stockImportFromWarehousePacketWise: false,
      stockImportFromWarehouseItemWise: false,
      stockReturnToWarehouse: false,
      userPrivilegesScreens: false,
      warehouseDB: false,
      syncAfterSave: false,
      withScanQty: false,
    });
  };

  const handleReset = () => {
    console.log('Privileges reset');
  };

  const checkboxItems = [
    { key: 'stockExportToBranchLTWise', label: 'Stock Export To Branch (LT Wise)' },
    { key: 'stockExportToBranch', label: 'Stock Export to Branch' },
    { key: 'stockReturnImportFromBranch', label: 'Stock Return Import From Branch' },
    { key: 'stockReturnImportFromBranchItemWise', label: 'Stock Return Import From Branch (Item Wise)' },
    { key: 'stockTransferReportLTWise', label: 'Stock Transfer Report (LT Wise)' },
    { key: 'fileTransferFlow', label: 'File Transfer Flow' },
    { key: 'printBarcodeWhileStockTransfers', label: 'Print Barcode While Stock Transfers' },
    { key: 'format16_AGRCBarcodePrint', label: '**Format #16 -- AGRC barcode Print' },
    { key: 'format15_BTBarcodePrint', label: '**Format #15 -- BT barcode Print' },
    { key: 'stockImportFromWarehouseLTWise', label: 'Stock Import From Warehouse (LT Wise)' },
    { key: 'stockImportFromWarehousePacketWise', label: 'Stock Import From Warehouse (Packet Wise)' },
    { key: 'stockImportFromWarehouseItemWise', label: 'Stock Import From Warehouse (Item Wise)' },
    { key: 'stockReturnToWarehouse', label: 'Stock Return To Warehouse' },
    { key: 'userPrivilegesScreens', label: 'User Privileges Screens' },
    { key: 'warehouseDB', label: 'WarehouseDB' },
    { key: 'syncAfterSave', label: 'Sync.AfterSave' },
    { key: 'withScanQty', label: 'with ScanQty' },
  ];

  const midPoint = Math.ceil(checkboxItems.length / 2);
  const leftColumn = checkboxItems.slice(0, midPoint);
  const rightColumn = checkboxItems.slice(midPoint);

  return (
    <View style={styles.fullScreenContainer}>
      <ScrollView style={styles.container}>
        <Text style={styles.header}>User Privileges</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="User :"
            value={user}
            onChangeText={setUser}
          />
          <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
        </View>

        <View style={styles.checkboxContainer}>
          <View style={styles.column}>
            {leftColumn.map((item) => (
              <CustomCheckBox
                key={item.key}
                checked={privileges[item.key as PrivilegeKey]}
                onPress={() => handleCheckboxChange(item.key as PrivilegeKey)}
                label={item.label}
              />
            ))}
          </View>
          <View style={styles.column}>
            {rightColumn.map((item) => (
              <CustomCheckBox
                key={item.key}
                checked={privileges[item.key as PrivilegeKey]}
                onPress={() => handleCheckboxChange(item.key as PrivilegeKey)}
                label={item.label}
              />
            ))}
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.button, styles.saveButton]}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>SAVE</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleClear}
            style={[styles.button, styles.clearButton]}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>CLEAR</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleReset}
            style={[styles.button, styles.resetButton]}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>RE-SET</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onBack}
            style={[styles.button, styles.exitButton]}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>EXIT</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  container: {
    padding: 24,
  },
  header: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 0.5,
    textDecorationLine: 'underline',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
  },
  searchIcon: {
    marginLeft: 10,
  },
  checkboxContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  column: {
    flex: 1,
    marginHorizontal: 5,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 5,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#3949AB',
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: '#3949AB',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#1A1A1A',
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  saveButton: {
    backgroundColor: '#28A745',
  },
  clearButton: {
    backgroundColor: '#DC3545',
  },
  resetButton: {
    backgroundColor: '#FFC107',
  },
  exitButton: {
    backgroundColor: '#6C757D',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default UserPrivileges;