import React, { useState } from 'react';
import {
  Box, Heading, Card, CardBody, VStack, FormControl, FormLabel,
  Input, Switch, Flex, Text, Button, Divider, Avatar, useColorModeValue,
  Grid, GridItem, Select, NumberInput, NumberInputField, NumberInputStepper,
  NumberIncrementStepper, NumberDecrementStepper, Textarea, Tabs, TabList,
  TabPanels, Tab, TabPanel, Badge, HStack, Icon, useToast, Stack,
  Radio, RadioGroup, Alert, AlertIcon, AlertTitle, AlertDescription,
  Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon,
  SimpleGrid, InputGroup, InputLeftAddon
} from '@chakra-ui/react';
import {
  Save, Store, Receipt, Bell, CreditCard, Palette, Clock, Upload,
  Download, Shield, RotateCcw, Printer, Tag, Package, Users, Database,
  User, Lock, Globe, Mail, MapPin, Phone, File as FileIcon, MessageCircle
} from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { userAPI } from '../services/api';

export default function Settings() {
  const { settings, updateSettings, resetSettings, user, exportData, importData, clearAllData } = useApp();
  const [activeTab, setActiveTab] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState(settings?.logoUrl || null);
  const [pinSaving, setPinSaving] = useState(false);
  const [pinCurrentPassword, setPinCurrentPassword] = useState('');
  const [pinNew, setPinNew] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const toast = useToast();
  const tenantId = typeof user?.tenantId === 'object' ? user?.tenantId?._id : user?.tenantId;
  const publicCatalogUrl = tenantId ? `${window.location.origin}/portal/${tenantId}` : '';

  const copyToClipboard = async (text) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Copied', description: 'Link copied to clipboard.', status: 'success', duration: 2000, position: 'top-right' });
    } catch {
      toast({ title: 'Copy failed', description: 'Please copy manually.', status: 'error', duration: 2500, position: 'top-right' });
    }
  };

  // Update logo preview when settings change
  React.useEffect(() => {
    if (settings?.logoUrl) {
      setLogoPreview(settings.logoUrl);
    }
  }, [settings?.logoUrl]);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    // Create FormData from the form element
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    try {
      // Construct the settings object with type conversions
      const processedData = {
        ...settings,
        features: {
          ...(settings?.features || {}),
          loyaltyEnabled: data['features.loyaltyEnabled'] === 'true'
        },
        storeName: data.storeName,
        contactNumber: data.contactNumber,
        orderReceivingNumber: data.orderReceivingNumber,
        email: data.email,
        address: data.address,
        currency: data.currency,
        gstRate: parseFloat(data.gstRate) || 0,
        lowStockThreshold: parseInt(data.lowStockThreshold) || 10,
        businessHours: {
          open: data['businessHours.open'],
          close: data['businessHours.close']
        },
        invoiceSettings: {
          ...settings.invoiceSettings,
          prefix: data['invoiceSettings.prefix'],
          startNumber: parseInt(data['invoiceSettings.startNumber']) || 1001,
          includeLogo: data['invoiceSettings.includeLogo'] === 'true'
        },
        receiptHeader: data.receiptHeader,
        receiptFooter: data.receiptFooter,
        receiptTaxNumber: data.receiptTaxNumber,
        posSettings: {
          ...settings.posSettings,
          autoPrintReceipt: data['posSettings.autoPrintReceipt'] === 'true',
          showStockDuringSale: data['posSettings.showStockDuringSale'] === 'true',
          enableDiscounts: data['posSettings.enableDiscounts'] === 'true',
          enableTax: data['posSettings.enableTax'] === 'true',
          roundOffTotal: data['posSettings.roundOffTotal'] === 'true',
          requireCustomerForSale: data['posSettings.requireCustomerForSale'] === 'true'
        },
        taxSettings: {
          ...settings.taxSettings,
          taxType: data['taxSettings.taxType'] || 'gst'
        },
        paymentMethods: {
          cash: true,
          card: false,
          upi: data['paymentMethods.upi'] === 'true',
          digitalWallet: false
        },
        inventorySettings: {
          ...settings.inventorySettings,
          autoReorder: data['inventorySettings.autoReorder'] === 'true',
          showCostPrice: data['inventorySettings.showCostPrice'] === 'true',
          enableCategories: data['inventorySettings.enableCategories'] === 'true'
        },
        enableLowStockAlerts: data.enableLowStockAlerts === 'true',
        enableEmailReports: data.enableEmailReports === 'true',
        emailReportTime: data.emailReportTime,
        timeFormat: data.timeFormat || '12h',
        businessCategory: data.businessCategory,
        website: data.website,
        mapLink: data.mapLink,
        instagram: data.instagram,
        facebook: data.facebook,
        bio: data.bio,
        secondaryContact: data.secondaryContact
      };

      await updateSettings(processedData);

      toast({
        title: "Settings Saved",
        description: "Your store preferences have been updated.",
        status: "success",
        duration: 3000,
        position: "top-right"
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: error.message,
        status: "error",
        duration: 4000
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateWhatsAppPin = async () => {
    const currentPassword = String(pinCurrentPassword || '');
    const newPin = String(pinNew || '').replace(/\D/g, '');
    const confirm = String(pinConfirm || '').replace(/\D/g, '');

    if (!currentPassword) {
      toast({ title: 'Current password required', status: 'warning', duration: 2500, position: 'top-right' });
      return;
    }
    if (!/^\d{4,6}$/.test(newPin)) {
      toast({ title: 'PIN must be 4–6 digits', status: 'warning', duration: 2500, position: 'top-right' });
      return;
    }
    if (newPin !== confirm) {
      toast({ title: 'PINs do not match', status: 'warning', duration: 2500, position: 'top-right' });
      return;
    }

    setPinSaving(true);
    try {
      await userAPI.setMyWhatsAppPin({ currentPassword, newPin });
      setPinCurrentPassword('');
      setPinNew('');
      setPinConfirm('');
      toast({ title: 'WhatsApp PIN updated', status: 'success', duration: 2500, position: 'top-right' });
    } catch (error) {
      toast({
        title: 'Failed to update PIN',
        description: error?.response?.data?.message || 'Please try again.',
        status: 'error',
        duration: 3500,
        position: 'top-right'
      });
    } finally {
      setPinSaving(false);
    }
  };

  const handleResetSettings = () => {
    if (window.confirm("Are you sure you want to reset all settings to defaults? This action cannot be undone.")) {
      resetSettings();
      toast({
        title: "Settings Reset",
        status: "info",
        duration: 3000,
      });
    }
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image under 2MB",
          status: "warning",
          duration: 3000,
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const logoDataUrl = reader.result;
        setLogoPreview(logoDataUrl);

        // Save logo to settings immediately
        updateSettings({
          ...settings,
          logoUrl: logoDataUrl
        });

        toast({
          title: "Logo saved",
          description: "Your store logo has been updated.",
          status: "success",
          duration: 2000,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const SettingsCard = ({ title, icon: IconComponent, children, description }) => (
    <Card
      bg="white"
      borderRadius="xl"
      border="1px solid"
      borderColor="gray.200"
      shadow="sm"
      overflow="hidden"
      mb={6}
    >
      <CardBody p={{ base: 4, md: 6 }}>
        <Flex align="center" gap={3} mb={2}>
          {IconComponent && (
            <Flex w="32px" h="32px" bg="brand.50" color="brand.500" borderRadius="lg" align="center" justify="center">
              <IconComponent size={18} />
            </Flex>
          )}
          <Box>
            <Heading size="md" color="gray.800" fontWeight="700">{title}</Heading>
            {description && <Text fontSize="sm" color="gray.500">{description}</Text>}
          </Box>
        </Flex>
        <Divider my={4} borderColor="gray.100" />
        {children}
      </CardBody>
    </Card>
  );

  const ToggleSetting = ({ label, description, name, defaultChecked, isDisabled = false }) => (
    <FormControl display="flex" alignItems="center" justifyContent="space-between">
      <Box maxW="80%">
        <FormLabel mb={0} fontWeight="600" color="gray.700">{label}</FormLabel>
        <Text fontSize="xs" color="gray.500">{description}</Text>
      </Box>
      <Switch name={name} defaultChecked={defaultChecked} value="true" colorScheme="brand" size="lg" isDisabled={isDisabled} />
    </FormControl>
  );

  return (
    <Box maxW="1200px" mx="auto" pb={20} p={{ base: 3, md: 0 }}>
      <form onSubmit={handleSave}>
        <Flex
          direction={{ base: 'column', md: 'row' }}
          justify="space-between"
          align={{ base: 'stretch', md: 'center' }}
          mb={{ base: 4, md: 8 }}
          gap={4}
          position="sticky"
          top={{ base: "56px", md: 0 }}
          zIndex={10}
          bg="gray.50"
          py={4}
          borderBottom="1px solid"
          borderColor="transparent"
          transition="all 0.2s"
          sx={{
            '&.stuck': {
              borderColor: 'gray.200',
              shadow: 'sm',
              bg: 'white/80',
              backdropFilter: 'blur(8px)'
            }
          }}
        >
          <Box>
            <Heading size="lg" color="gray.800" letterSpacing="-0.5px">Settings</Heading>
            <Text color="gray.500">Manage your store preferences</Text>
          </Box>
          <HStack spacing={4} wrap={{ base: 'wrap', sm: 'nowrap' }}>
            <Button
              leftIcon={<RotateCcw size={16} />}
              variant="ghost"
              colorScheme="gray"
              onClick={handleResetSettings}
              flex={{ base: '1', sm: 'initial' }}
            >
              Reset
            </Button>
            <Button
              type="submit"
              leftIcon={<Save size={18} />}
              colorScheme="brand"
              isLoading={isSaving}
              loadingText="Saving..."
              shadow="md"
              px={8}
              w={{ base: 'full', sm: 'auto' }}
            >
              Save Changes
            </Button>
          </HStack>
        </Flex>

        <Tabs
          colorScheme="brand"
          variant="soft-rounded"
          orientation="horizontal"
          index={activeTab}
          onChange={setActiveTab}
        >
          <TabList
            overflowX="auto"
            py={2}
            mb={6}
            gap={2}
            sx={{
              '&::-webkit-scrollbar': { display: 'none' },
              scrollbarWidth: 'none'
            }}
          >
            <Tab _selected={{ bg: 'white', color: 'brand.600', shadow: 'sm', fontWeight: 'bold' }}><Icon as={Store} mr={2} /> Store</Tab>
            <Tab _selected={{ bg: 'white', color: 'brand.600', shadow: 'sm', fontWeight: 'bold' }}><Icon as={Printer} mr={2} /> POS</Tab>
            <Tab _selected={{ bg: 'white', color: 'brand.600', shadow: 'sm', fontWeight: 'bold' }}><Icon as={Receipt} mr={2} /> Invoice</Tab>
            <Tab _selected={{ bg: 'white', color: 'brand.600', shadow: 'sm', fontWeight: 'bold' }}><Icon as={CreditCard} mr={2} /> Tax & Payments</Tab>
            <Tab _selected={{ bg: 'white', color: 'brand.600', shadow: 'sm', fontWeight: 'bold' }}><Icon as={Package} mr={2} /> Inventory</Tab>
            <Tab _selected={{ bg: 'white', color: 'brand.600', shadow: 'sm', fontWeight: 'bold' }}><Icon as={Database} mr={2} /> Data</Tab>
          </TabList>

          <TabPanels>
            {/* Store Tab */}
            <TabPanel p={0}>
              <SettingsCard title="Store Profile" icon={Store} description="General information about your business">
                <Grid templateColumns={{ base: "1fr", md: "1fr 2fr" }} gap={8}>
                  <Box>
                    <Box
                      position="relative"
                      w="150px"
                      h="150px"
                      mx="auto"
                      borderRadius="full"
                      overflow="hidden"
                      border="2px dashed"
                      borderColor="gray.300"
                      bg="gray.50"
                    >
                      <Avatar
                        w="100%"
                        h="100%"
                        borderRadius="full"
                        name={settings?.storeName || 'Store'}
                        src={logoPreview || settings?.logoUrl || null}
                        icon={<Store size={48} color="gray" />}
                      />
                      <Box position="absolute" inset={0} bg="blackAlpha.0" _hover={{ bg: 'blackAlpha.400' }} transition="all 0.2s" display="flex" alignItems="center" justifyContent="center" opacity={0} _groupHover={{ opacity: 1 }} className="group">
                        <Button as="label" size="sm" colorScheme="whiteAlpha" cursor="pointer">
                          Change Logo
                          <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                        </Button>
                      </Box>
                    </Box>
                    <Text textAlign="center" mt={3} fontSize="xs" color="gray.500">Max size 2MB</Text>
                  </Box>

                  <VStack spacing={5} align="stretch">
                    <FormControl>
                      <FormLabel>Store Name</FormLabel>
                      <InputGroup>
                        <InputLeftAddon children={<Store size={16} />} />
                        <Input name="storeName" defaultValue={settings?.storeName} placeholder="My Business Name" fontWeight="600" />
                      </InputGroup>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Public Catalog Link</FormLabel>
                      <HStack spacing={3}>
                        <Input
                          value={publicCatalogUrl || 'Tenant not linked (contact admin)'}
                          isReadOnly
                          fontSize="sm"
                          opacity={publicCatalogUrl ? 1 : 0.7}
                        />
                        <Button
                          onClick={() => copyToClipboard(publicCatalogUrl)}
                          isDisabled={!publicCatalogUrl}
                          variant="outline"
                        >
                          Copy
                        </Button>
                      </HStack>
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        Share this link to show your POS catalog with prices (payment can be added later).
                      </Text>
                    </FormControl>

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
                      <FormControl>
                        <FormLabel>Email</FormLabel>
                        <InputGroup>
                          <InputLeftAddon children={<Mail size={16} />} />
                          <Input name="email" type="email" defaultValue={settings?.email} placeholder="business@example.com" />
                        </InputGroup>
                      </FormControl>
                      <FormControl>
                        <FormLabel>Primary Phone</FormLabel>
                        <InputGroup>
                          <InputLeftAddon children={<Phone size={16} />} />
                          <Input name="contactNumber" defaultValue={settings?.contactNumber} placeholder="+91 ..." />
                        </InputGroup>
                      </FormControl>
                    </SimpleGrid>

                    <FormControl>
                      <FormLabel>WhatsApp Order Receiving Number</FormLabel>
                      <InputGroup>
                        <InputLeftAddon children={<MessageCircle size={16} />} />
                        <Input name="orderReceivingNumber" defaultValue={settings?.orderReceivingNumber} placeholder="e.g. +91 9876543210" />
                      </InputGroup>
                      <Text fontSize="xs" color="gray.500" mt={1} mb={5}>Public portal shopping cart orders will be sent to this WhatsApp number.</Text>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Address</FormLabel>
                      <Textarea name="address" defaultValue={settings?.address} rows={3} placeholder="Full business address" />
                      <Text fontSize="xs" color="blue.500" mt={1}>📍 This address is sent to customers who ask for Store Info on WhatsApp.</Text>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Business Bio / Description</FormLabel>
                      <Textarea name="bio" defaultValue={settings?.bio} placeholder="Tell customers about your business..." rows={2} />
                    </FormControl>

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
                      <FormControl>
                        <FormLabel>Business Category</FormLabel>
                        <Input name="businessCategory" defaultValue={settings?.businessCategory} placeholder="e.g. Retail, Restaurant" />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Website</FormLabel>
                        <InputGroup>
                          <InputLeftAddon children={<Globe size={16} />} />
                          <Input name="website" defaultValue={settings?.website} placeholder="www.example.com" />
                        </InputGroup>
                      </FormControl>
                    </SimpleGrid>

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
                      <FormControl>
                        <FormLabel>Secondary Contact Number</FormLabel>
                        <InputGroup>
                          <InputLeftAddon children={<Phone size={16} />} />
                          <Input name="secondaryContact" defaultValue={settings?.secondaryContact} placeholder="Alternate number" />
                        </InputGroup>
                      </FormControl>
                      <FormControl>
                        <FormLabel>Google Maps / Location Link</FormLabel>
                        <InputGroup>
                          <InputLeftAddon children={<MapPin size={16} />} />
                          <Input name="mapLink" defaultValue={settings?.mapLink} placeholder="https://maps.google.com/..." />
                        </InputGroup>
                      </FormControl>
                    </SimpleGrid>

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
                      <FormControl>
                        <FormLabel>Instagram</FormLabel>
                        <Input name="instagram" defaultValue={settings?.instagram} placeholder="@username" />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Facebook</FormLabel>
                        <Input name="facebook" defaultValue={settings?.facebook} placeholder="facebook.com/page" />
                      </FormControl>
                    </SimpleGrid>

                    <FormControl>
                      <FormLabel>Business Hours ({settings?.timeFormat === '24h' ? '24h' : '12h'})</FormLabel>
                      <VStack align="stretch" spacing={2}>
                        <HStack>
                          <Input type="time" name="businessHours.open" defaultValue={settings?.businessHours?.open} />
                          <Text fontSize="sm">to</Text>
                          <Input type="time" name="businessHours.close" defaultValue={settings?.businessHours?.close} />
                        </HStack>
                        <Select name="timeFormat" size="xs" defaultValue={settings?.timeFormat || '12h'} variant="filled">
                          <option value="12h">12-Hour Format (AM/PM)</option>
                          <option value="24h">24-Hour Format (Railway)</option>
                        </Select>
                      </VStack>
                    </FormControl>
                  </VStack>
                </Grid>
              </SettingsCard>
            </TabPanel>

            {/* POS Tab */}
            <TabPanel p={0}>
              <SettingsCard title="POS Configuration" icon={Printer} description="Customize your Point of Sale experience">
                <VStack spacing={6} align="stretch">
                  <ToggleSetting
                    label="Auto Print Receipts"
                    description="Automatically trigger print dialog after successful checkout"
                    name="posSettings.autoPrintReceipt"
                    defaultChecked={settings?.posSettings?.autoPrintReceipt}
                  />
                  <Box p={3} borderRadius="md" bg={useColorModeValue('gray.100', 'gray.700')}>
                    <Text fontSize="sm" fontWeight="medium">No physical printer?</Text>
                    <Text fontSize="xs" mt={1}>
                      Click "Download PDF" from the Sales screen after checkout, or use any standard 80mm thermal POS printer.
                      Recommended: Star Micronics TSP143, Epson TM-T20II/TM-T88V, Bixolon SRP-350.
                    </Text>
                  </Box>
                  <Divider />
                  <ToggleSetting
                    label="Show Stock During Sale"
                    description="Display current inventory levels on product cards in POS"
                    name="posSettings.showStockDuringSale"
                    defaultChecked={settings?.posSettings?.showStockDuringSale}
                  />
                  <Divider />
                  <ToggleSetting
                    label="Enable Discounts"
                    description="Allow cashiers to apply discounts to line items or entire sale"
                    name="posSettings.enableDiscounts"
                    defaultChecked={settings?.posSettings?.enableDiscounts}
                  />
                  <Divider />
                  <ToggleSetting
                    label="Require Customer"
                    description="Force customer selection before completing a sale"
                    name="posSettings.requireCustomerForSale"
                    defaultChecked={settings?.posSettings?.requireCustomerForSale}
                  />
                </VStack>
              </SettingsCard>

              <SettingsCard title="Customer & Rewards" icon={Users} description="Enable or disable loyalty for this store">
                <VStack spacing={6} align="stretch">
                  <ToggleSetting
                    label="Enable Loyalty (Points & Tiers)"
                    description="Turn this off if you want POS-only mode. Rewards tabs and public points checks will be hidden."
                    name="features.loyaltyEnabled"
                    defaultChecked={settings?.features?.loyaltyEnabled ?? true}
                  />
                  <Alert status="info" borderRadius="lg">
                    <AlertIcon />
                    <Box>
                      <AlertTitle fontSize="sm">Tip</AlertTitle>
                      <AlertDescription fontSize="sm">
                        You can still keep customer records and WhatsApp receipts even when loyalty is disabled.
                      </AlertDescription>
                    </Box>
                  </Alert>
                </VStack>
              </SettingsCard>

              <SettingsCard title="WhatsApp Admin PIN" icon={Lock} description="Set a PIN for WhatsApp settings approvals (4–6 digits)">
                <VStack spacing={4} align="stretch">
                  <Alert status="info" borderRadius="lg">
                    <AlertIcon />
                    <Box>
                      <AlertTitle fontSize="sm">Security</AlertTitle>
                      <AlertDescription fontSize="sm">
                        This PIN is required for WhatsApp admin actions like toggling Bot Active, Auto Receipts, and Loyalty.
                      </AlertDescription>
                    </Box>
                  </Alert>

                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                    <FormControl>
                      <FormLabel>Current Password</FormLabel>
                      <Input
                        type="password"
                        value={pinCurrentPassword}
                        onChange={(e) => setPinCurrentPassword(e.target.value)}
                        placeholder="Your login password"
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>New PIN</FormLabel>
                      <Input
                        type="password"
                        inputMode="numeric"
                        value={pinNew}
                        onChange={(e) => setPinNew(e.target.value)}
                        placeholder="4–6 digits"
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Confirm PIN</FormLabel>
                      <Input
                        type="password"
                        inputMode="numeric"
                        value={pinConfirm}
                        onChange={(e) => setPinConfirm(e.target.value)}
                        placeholder="Re-enter PIN"
                      />
                    </FormControl>
                  </SimpleGrid>

                  <Flex justify="flex-end">
                    <Button
                      type="button"
                      colorScheme="brand"
                      onClick={handleUpdateWhatsAppPin}
                      isLoading={pinSaving}
                      loadingText="Updating..."
                    >
                      Update PIN
                    </Button>
                  </Flex>
                </VStack>
              </SettingsCard>
            </TabPanel>

            {/* Invoice Tab */}
            <TabPanel p={0}>
              <SettingsCard title="Invoice Settings" icon={Receipt} description="Configure receipt numbering and layout">
                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
                  <FormControl>
                    <FormLabel>Invoice Prefix</FormLabel>
                    <Input name="invoiceSettings.prefix" defaultValue={settings?.invoiceSettings?.prefix || 'INV'} placeholder="e.g. INV-" />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Starting Number</FormLabel>
                    <NumberInput min={1} defaultValue={settings?.invoiceSettings?.startNumber || 1001}>
                      <NumberInputField name="invoiceSettings.startNumber" />
                    </NumberInput>
                  </FormControl>
                  <GridItem colSpan={2}>
                    <ToggleSetting
                      label="Include Logo on Receipt"
                      description="Print store logo at the top of thermal receipts"
                      name="invoiceSettings.includeLogo"
                      defaultChecked={settings?.invoiceSettings?.includeLogo}
                    />
                  </GridItem>
                </Grid>
              </SettingsCard>
              <SettingsCard title="Receipt Content" icon={FileIcon} description="Custom text on your receipts">
                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
                  <FormControl>
                    <FormLabel>Header Text</FormLabel>
                    <Textarea name="receiptHeader" defaultValue={settings?.receiptHeader} placeholder="e.g. Welcome to Our Store" rows={2} />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Footer Text</FormLabel>
                    <Textarea name="receiptFooter" defaultValue={settings?.receiptFooter} placeholder="e.g. Thank you, Visit Again!" rows={2} />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Tax ID / GSTIN</FormLabel>
                    <Input name="receiptTaxNumber" defaultValue={settings?.receiptTaxNumber} placeholder="GSTIN..." />
                  </FormControl>
                </Grid>
              </SettingsCard>
            </TabPanel>

            {/* Tax Tab */}
            <TabPanel p={0}>
              <SettingsCard title="Tax Configuration" icon={CreditCard} description="Manage tax rates and calculations">
                <VStack spacing={6} align="stretch">
                  <ToggleSetting
                    label="Enable Tax Calculation"
                    description="Calculate and add tax to line items in POS"
                    name="posSettings.enableTax"
                    defaultChecked={settings?.posSettings?.enableTax}
                  />
                  <Divider />
                  <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
                    <FormControl>
                      <FormLabel>Standard GST Rate (%)</FormLabel>
                      <NumberInput min={0} max={100} step={0.1} defaultValue={settings?.gstRate || 0}>
                        <NumberInputField name="gstRate" />
                      </NumberInput>
                    </FormControl>
                    <FormControl>
                      <FormLabel>Tax Type Label</FormLabel>
                      <Select name="taxSettings.taxType" defaultValue={settings?.taxSettings?.taxType || 'gst'}>
                        <option value="gst">GST</option>
                        <option value="vat">VAT</option>
                        <option value="sales_tax">Sales Tax</option>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Divider />

                  <FormControl>
                    <FormLabel>System Currency</FormLabel>
                    <Select name="currency" defaultValue={settings?.currency}>
                      <option value="₹">Indian Rupee (₹)</option>
                      <option value="$">US Dollar ($)</option>
                      <option value="€">Euro (€)</option>
                      <option value="£">British Pound (£)</option>
                    </Select>
                  </FormControl>
                </VStack>
              </SettingsCard>
              <SettingsCard title="Payment Methods" icon={CreditCard} description="Accepted payment modes at POS">
                <VStack spacing={4} align="stretch">
                  <ToggleSetting
                    label="Cash"
                    description="Always available for POS checkout"
                    name="paymentMethods.cash"
                    defaultChecked={true}
                    isDisabled
                  />
                  <ToggleSetting
                    label="UPI"
                    description="Show UPI option during POS checkout and transactions"
                    name="paymentMethods.upi"
                    defaultChecked={settings?.paymentMethods?.upi ?? true}
                  />
                </VStack>
              </SettingsCard>
            </TabPanel>

            {/* Inventory Tab */}
            <TabPanel p={0}>
              <SettingsCard title="Inventory Management" icon={Package} description="Stock control and alerting preferences">
                <VStack spacing={6} align="stretch">
                  <FormControl>
                    <FormLabel>Low Stock Threshold (Global)</FormLabel>
                    <NumberInput min={0} defaultValue={settings?.lowStockThreshold || 10}>
                      <NumberInputField name="lowStockThreshold" />
                    </NumberInput>
                    <Text fontSize="xs" color="gray.500" mt={1}>Products below this quantity will be flagged</Text>
                  </FormControl>
                  <Divider />
                  <ToggleSetting
                    label="Enable Low Stock Alerts"
                    description="Show warning badges and notifications for low stock items"
                    name="enableLowStockAlerts"
                    defaultChecked={settings?.enableLowStockAlerts}
                  />
                  <Divider />
                  <ToggleSetting
                    label="Show Cost Price"
                    description="Visible only to Admins in inventory list"
                    name="inventorySettings.showCostPrice"
                    defaultChecked={settings?.inventorySettings?.showCostPrice}
                  />
                  <Divider />
                  <ToggleSetting
                    label="Enable Categories"
                    description="Use categories to organize products"
                    name="inventorySettings.enableCategories"
                    defaultChecked={settings?.inventorySettings?.enableCategories}
                  />
                </VStack>
              </SettingsCard>
            </TabPanel>

            {/* Data Tab */}
            <TabPanel p={0}>
              <SettingsCard title="Data Management" icon={Database} description="Backup and recovery options">
                <Alert status="info" mb={6} borderRadius="lg" variant="subtle">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Smart Backup</AlertTitle>
                    <AlertDescription>
                      Your data is stored locally. We recommend exporting a backup file weekly.
                    </AlertDescription>
                  </Box>
                </Alert>
                <Flex direction={{ base: 'column', sm: 'row' }} gap={4} mb={8}>
                  <Button leftIcon={<Upload size={18} />} colorScheme="brand" onClick={() => exportData('all')} size="lg" flex={1} w={{ base: 'full', sm: 'auto' }}>
                    Export Database (JSON)
                  </Button>
                  <Button as="label" leftIcon={<Download size={18} />} colorScheme="gray" variant="outline" size="lg" flex={1} cursor="pointer" w={{ base: 'full', sm: 'auto' }}>
                    Import Database
                    <input type="file" accept=".json" onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => importData(JSON.parse(e.target.result));
                        reader.readAsText(file);
                      }
                    }} style={{ display: 'none' }} />
                  </Button>
                </Flex>

                <Accordion allowToggle>
                  <AccordionItem border="none">
                    <AccordionButton _expanded={{ bg: 'red.50', color: 'red.600' }} borderRadius="lg">
                      <Box flex="1" textAlign="left" fontWeight="bold">
                        Danger Zone
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4}>
                      <Box p={4} bg="red.50" borderRadius="xl" border="1px solid" borderColor="red.100" mt={2}>
                        <Heading size="sm" color="red.700" mb={2}>Factory Reset</Heading>
                        <Text fontSize="sm" color="red.600" mb={4}>
                          This will delete ALL products, sales, customers, and settings. This action cannot be undone.
                        </Text>
                        <Button colorScheme="red" onClick={clearAllData} size="sm">
                          Format System
                        </Button>
                      </Box>
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>
              </SettingsCard>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </form>
    </Box>
  );
}
