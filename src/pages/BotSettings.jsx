import React, { useState, useEffect } from 'react';
import {
    Box, Flex, Text, Button, VStack, HStack, Badge,
    useColorModeValue, Spinner, Heading, Icon, Divider, Tooltip,
    Alert, AlertIcon, AlertTitle, AlertDescription,
    FormControl, FormLabel, Switch, Textarea, NumberInput, NumberInputField,
    NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper,
    Input, InputGroup, InputRightElement, IconButton, Code, useClipboard, Select
} from '@chakra-ui/react';
import { Smartphone, CheckCircle, XCircle, Settings as SettingsIcon, Save, ExternalLink, Copy, CheckCheck, Send, Trash2, Eye, EyeOff } from 'lucide-react';
import { tenantAPI } from '../services/api';
import { toast } from 'react-hot-toast';

export default function BotSettings() {
    const [status, setStatus] = useState(null);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [disconnecting, setDisconnecting] = useState(false);
    const [savingSettings, setSavingSettings] = useState(false);
    const [diagnostics, setDiagnostics] = useState(null);
    const [diagnosing, setDiagnosing] = useState(false);

    // Cloud API credential form
    const [phoneNumberId, setPhoneNumberId] = useState('');
    const [accessToken, setAccessToken] = useState('');
    const [botNumber, setBotNumber] = useState('');
    const [testPhone, setTestPhone] = useState('');
    const [showToken, setShowToken] = useState(false);

    const cardBg = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const codeBg = useColorModeValue('gray.50', 'gray.900');

    // Clipboard for webhook URL
    // Prefer backend-provided URL; otherwise derive from VITE_API_URL when it is absolute.
    const apiBase = import.meta.env.VITE_API_URL || '/api';
    const derivedWebhookUrl = typeof apiBase === 'string' && apiBase.startsWith('http')
        ? apiBase.replace(/\/api\/?$/, '') + '/webhook'
        : `${window.location.origin}/webhook`;
    const webhookUrl = status?.webhookUrl || derivedWebhookUrl;
    const verifyToken = status?.webhookVerifyToken || '';
    const { hasCopied: copiedUrl, onCopy: copyUrl } = useClipboard(webhookUrl);
    const { hasCopied: copiedToken, onCopy: copyToken } = useClipboard(verifyToken);

    const fetchStatus = async () => {
        try {
            const res = await tenantAPI.getWhatsAppStatus();
            setStatus(res.data);
            // Pre-fill form with saved values so page never looks empty
            if (res.data?.phoneNumberId) setPhoneNumberId(res.data.phoneNumberId);
            if (res.data?.botNumber) setBotNumber(res.data.botNumber);
        } catch (error) {
            if (error.response?.status === 404) {
                setStatus({ isLinked: false, sessionStatus: 'disconnected' });
            } else {
                toast.error('Failed to connect to Bot server.');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchSettings = async () => {
        try {
            const res = await tenantAPI.getSettings();
            setSettings(res.data);
        } catch (error) {
            console.error('Failed to fetch bot settings:', error);
        }
    };

    useEffect(() => {
        fetchStatus();
        fetchSettings();
    }, []);

    const handleSaveCredentials = async () => {
        if (!phoneNumberId) {
            return toast.error('Phone Number ID is required.');
        }
        // Only require access token if not already configured
        if (!status?.isConfigured && !accessToken) {
            return toast.error('Access Token is required for initial setup.')
        }
        setSaving(true);
        try {
            const payload = { phoneNumberId, botNumber };
            // Only send token if user typed one (empty = keep existing)
            if (accessToken) payload.accessToken = accessToken;

            const res = await tenantAPI.saveCloudCredentials(payload);
            toast.success('Bot credentials saved! Now configure your webhook in Meta.');
            // Update status with returned webhook info
            setStatus(prev => ({
                ...prev,
                sessionStatus: 'connected',
                isConfigured: true,
                phoneNumberId,
                webhookVerifyToken: res.data.webhookVerifyToken,
                webhookUrl: res.data.webhookUrl,
                botNumber
            }));
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save credentials.');
        } finally {
            setSaving(false);
        }
    };

    const handleTestConnection = async () => {
        if (!testPhone || testPhone.length < 10) {
            return toast.error('Enter a valid phone number with country code (e.g. 919025980641)');
        }
        setTesting(true);
        try {
            await tenantAPI.testBotConnection({ testPhoneNumber: testPhone });
            toast.success('Test message sent! Check your WhatsApp inbox.');
        } catch (error) {
            const payload = error.response?.data;
            const extra =
                typeof payload?.error === 'string'
                    ? payload.error
                    : payload?.metaError?.message || '';
            const msg = (payload?.message || 'Test message failed.') + (extra ? `\n${extra}` : '');
            // Replace the generic 500 toast from the global interceptor with the real reason.
            toast.error(msg, { id: 'server-error-500', duration: 9000 });
        } finally {
            setTesting(false);
        }
    };

    const handleRunDiagnostics = async () => {
        setDiagnosing(true);
        try {
            const res = await tenantAPI.getWhatsAppDiagnostics();
            setDiagnostics(res.data);
            toast.success('Diagnostics updated.');
        } catch (error) {
            const payload = error.response?.data;
            toast.error(payload?.message || 'Failed to run diagnostics.', { id: 'server-error-500' });
        } finally {
            setDiagnosing(false);
        }
    };

    const handleDisconnect = async () => {
        if (!window.confirm('Disconnect the bot? This will clear all credentials. You will need to reconfigure.')) return;
        setDisconnecting(true);
        try {
            await tenantAPI.disconnectWhatsApp();
            toast.success('Bot disconnected.');
            setStatus(prev => ({ ...prev, sessionStatus: 'disconnected', isConfigured: false, webhookVerifyToken: null }));
            setPhoneNumberId('');
            setAccessToken('');
        } catch (error) {
            toast.error('Failed to disconnect.');
        } finally {
            setDisconnecting(false);
        }
    };

    const handleSaveSettings = async () => {
        setSavingSettings(true);
        try {
            await tenantAPI.updateSettings(settings);
            toast.success('Bot settings saved!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save settings.');
        } finally {
            setSavingSettings(false);
        }
    };

    if (loading) {
        return <Flex h="50vh" justify="center" align="center"><Spinner size="xl" color="brand.500" thickness="4px" /></Flex>;
    }

    const isConnected = status?.sessionStatus === 'connected' && status?.isConfigured;
    const lastWebhookAt = diagnostics?.whatsappData?.lastWebhookAt || status?.lastWebhookAt || null;

    return (
        <Box maxW={{ base: '100%', md: '850px' }} mx="auto" p={{ base: 0, md: 6 }} pb={{ base: 24, md: 6 }}>
            <Heading mb={2} size="lg" display="flex" alignItems="center" gap={3}>
                <Icon as={Smartphone} color="brand.500" />
                WhatsApp Bot Setup
            </Heading>
            <Text color="gray.500" mb={6} fontSize="sm">
                Powered by <strong>Meta WhatsApp Business Cloud API</strong> — Production-grade, zero server overhead.
            </Text>

            {/* Status Card */}
            <Box bg={cardBg} p={6} mb={6} borderRadius="2xl" border="1px" borderColor={borderColor} boxShadow="sm">
                <Flex justify="space-between" align={{ base: 'flex-start', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={4}>
                    <VStack align="start" spacing={1}>
                        <Text fontSize="xs" color="gray.400" fontWeight="bold" textTransform="uppercase" letterSpacing="wide">Connection Status</Text>
                        <HStack>
                            {isConnected ? (
                                <Badge colorScheme="green" px={3} py={1} borderRadius="full" display="flex" alignItems="center" gap={2}>
                                    <Icon as={CheckCircle} size={14} /> LIVE
                                </Badge>
                            ) : (
                                <Badge colorScheme="red" px={3} py={1} borderRadius="full" display="flex" alignItems="center" gap={2}>
                                    <Icon as={XCircle} size={14} /> NOT CONFIGURED
                                </Badge>
                            )}
                        </HStack>
                    </VStack>
                    {isConnected && status?.botNumber && (
                        <VStack align="end" spacing={0}>
                            <Text fontSize="sm" color="gray.500">Bot Number</Text>
                            <Text fontSize="xl" fontWeight="bold" color="brand.600">+{status.botNumber}</Text>
                        </VStack>
                    )}
                </Flex>
            </Box>

            {/* Diagnostics */}
            <Box bg={cardBg} p={6} mb={6} borderRadius="2xl" border="1px" borderColor={borderColor} boxShadow="sm">
                <Flex justify="space-between" align={{ base: 'stretch', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={3}>
                    <Box>
                        <Text fontWeight="bold">Diagnostics</Text>
                        <Text fontSize="sm" color="gray.500">
                            Use this when the bot says “connected” but does not reply to WhatsApp messages.
                        </Text>
                    </Box>
                    <Button
                        w={{ base: '100%', md: 'auto' }}
                        variant="outline"
                        onClick={handleRunDiagnostics}
                        isLoading={diagnosing}
                        loadingText="Checking..."
                    >
                        Run Diagnostics
                    </Button>
                </Flex>

                <Divider my={4} />

                <VStack align="stretch" spacing={3}>
                    <HStack justify="space-between" flexWrap="wrap">
                        <Text fontSize="sm" color="gray.600">Last webhook received</Text>
                        <Text fontSize="sm" fontFamily="mono">
                            {lastWebhookAt ? new Date(lastWebhookAt).toLocaleString() : 'Never (webhook not hitting this server)'}
                        </Text>
                    </HStack>

                    {diagnostics?.cloudApi && (
                        <Box border="1px" borderColor={borderColor} borderRadius="lg" p={3} bg={codeBg}>
                            <Text fontSize="sm" fontWeight="bold" mb={1}>
                                Meta Cloud API check: {diagnostics.cloudApi.success ? 'OK' : 'ERROR'}
                            </Text>
                            {!diagnostics.cloudApi.success ? (
                                <Text fontSize="sm" color="red.500" whiteSpace="pre-wrap">
                                    {diagnostics.cloudApi.error}
                                </Text>
                            ) : (
                                <Text fontSize="sm" color="gray.700" whiteSpace="pre-wrap">
                                    Phone: {diagnostics.cloudApi.phoneNumber?.display_phone_number || 'Unknown'}{'\n'}
                                    Verified Name: {diagnostics.cloudApi.phoneNumber?.verified_name || 'Unknown'}
                                </Text>
                            )}
                            {!diagnostics.cloudApi.success && diagnostics.cloudApi.metaError?.message && (
                                <Text fontSize="xs" color="gray.600" mt={2} whiteSpace="pre-wrap">
                                    {diagnostics.cloudApi.metaError.message}
                                </Text>
                            )}
                        </Box>
                    )}

                    {diagnostics?.server && (
                        <Text fontSize="xs" color="gray.500">
                            Server: {diagnostics.server.backendUrl} | Env: {diagnostics.server.nodeEnv} | App Secret: {diagnostics.server.hasWhatsappAppSecret ? 'set' : 'missing'}
                        </Text>
                    )}
                </VStack>
            </Box>

            {/* Step 1: Meta Setup Guide */}
            <Box bg={cardBg} p={8} mb={6} borderRadius="2xl" border="1px" borderColor={borderColor} boxShadow="sm">
                <Heading size="md" mb={2} display="flex" alignItems="center" gap={2}>
                    <Text as="span" bg="brand.500" color="white" borderRadius="full" w="28px" h="28px" display="flex" alignItems="center" justifyContent="center" fontSize="sm">1</Text>
                    Get Your Meta Credentials
                </Heading>
                <Text color="gray.500" mb={4} fontSize="sm">
                    You need a free Meta Developer account to get your Phone Number ID and Access Token.
                </Text>
                <Alert status="info" borderRadius="lg" mb={4}>
                    <AlertIcon />
                    <Box>
                        <AlertTitle>One-Time Setup (~15 minutes)</AlertTitle>
                        <AlertDescription fontSize="sm">
                            1. Go to <strong>developers.facebook.com</strong> → Create App → Add WhatsApp product<br />
                            2. In the WhatsApp → API Setup page, copy your <strong>Phone Number ID</strong> and generate a <strong>Permanent Token</strong>.
                        </AlertDescription>
                    </Box>
                </Alert>
                <Button
                    as="a"
                    href="https://developers.facebook.com/apps"
                    target="_blank"
                    size="sm"
                    colorScheme="blue"
                    variant="outline"
                    leftIcon={<Icon as={ExternalLink} size={14} />}
                    w={{ base: 'full', sm: 'auto' }}
                >
                    Open Meta Developer Console
                </Button>
            </Box>

            {/* Step 2: Enter Credentials */}
            <Box bg={cardBg} p={8} mb={6} borderRadius="2xl" border="1px" borderColor={borderColor} boxShadow="sm">
                <Heading size="md" mb={4} display="flex" alignItems="center" gap={2}>
                    <Text as="span" bg="brand.500" color="white" borderRadius="full" w="28px" h="28px" display="flex" alignItems="center" justifyContent="center" fontSize="sm">2</Text>
                    {status?.isConfigured ? 'Update API Credentials' : 'Enter API Credentials'}
                </Heading>

                {/* Show a green banner when credentials are already saved */}
                {status?.isConfigured && (
                    <Alert status="success" borderRadius="lg" mb={4}>
                        <AlertIcon />
                        <Box>
                            <AlertTitle>Credentials Already Saved ✅</AlertTitle>
                            <AlertDescription fontSize="sm">
                                Your Phone Number ID is already configured. Only update the fields below if you need to change them.
                            </AlertDescription>
                        </Box>
                    </Alert>
                )}

                <VStack spacing={4} align="stretch">
                    <FormControl>
                        <FormLabel fontWeight="bold" fontSize="sm">Phone Number ID</FormLabel>
                        <Text fontSize="xs" color="gray.500" mb={1}>Found in Meta Developer Console → WhatsApp → API Setup</Text>
                        <Input
                            placeholder="e.g. 123456789012345"
                            value={phoneNumberId}
                            onChange={(e) => setPhoneNumberId(e.target.value.trim())}
                            fontFamily="mono"
                        />
                    </FormControl>

                    <FormControl>
                        <FormLabel fontWeight="bold" fontSize="sm">Permanent Access Token</FormLabel>
                        <Text fontSize="xs" color="gray.500" mb={1}>
                            {status?.isConfigured
                                ? 'Leave blank to keep your existing token. Only enter a new token to replace it.'
                                : 'Generate from Meta Developer Console → System Users (never expires)'}
                        </Text>
                        <InputGroup>
                            <Input
                                placeholder={status?.isConfigured ? '(unchanged — enter new token to update)' : 'EAAxxxx...'}
                                value={accessToken}
                                onChange={(e) => setAccessToken(e.target.value.trim())}
                                type={showToken ? 'text' : 'password'}
                                fontFamily="mono"
                                pr="10"
                            />
                            <InputRightElement>
                                <IconButton
                                    size="sm"
                                    variant="ghost"
                                    aria-label="Toggle token visibility"
                                    icon={<Icon as={showToken ? EyeOff : Eye} size={14} />}
                                    onClick={() => setShowToken(!showToken)}
                                />
                            </InputRightElement>
                        </InputGroup>
                    </FormControl>

                    <FormControl>
                        <FormLabel fontWeight="bold" fontSize="sm">Bot's WhatsApp Number (Display Only)</FormLabel>
                        <Text fontSize="xs" color="gray.500" mb={1}>The number you registered with Meta, with country code (no +)</Text>
                        <Input
                            placeholder="e.g. 919025980641"
                            value={botNumber}
                            onChange={(e) => setBotNumber(e.target.value.replace(/\D/g, ''))}
                            fontFamily="mono"
                        />
                    </FormControl>

                    <Button
                        colorScheme="brand"
                        leftIcon={<Icon as={Save} />}
                        onClick={handleSaveCredentials}
                        isLoading={saving}
                        loadingText="Saving..."
                        alignSelf={{ base: 'stretch', sm: 'flex-start' }}
                    >
                        {status?.isConfigured ? 'Update Credentials' : 'Save Credentials'}
                    </Button>
                </VStack>
            </Box>

            {/* Step 3: Configure Webhook (only shown after credentials are saved) */}
            {status?.webhookVerifyToken && (
                <Box bg={cardBg} p={8} mb={6} borderRadius="2xl" border="1px" borderColor={borderColor} boxShadow="sm">
                    <Heading size="md" mb={6} display="flex" alignItems="center" gap={2}>
                        <Text as="span" bg="green.500" color="white" borderRadius="full" w="28px" h="28px" display="flex" alignItems="center" justifyContent="center" fontSize="sm">3</Text>
                        Configure Webhook in Meta Console
                    </Heading>
                    <Text color="gray.500" fontSize="sm" mb={4}>
                        In Meta Developer Console → WhatsApp → Configuration → Webhook, enter these values:
                    </Text>
                    <VStack spacing={3} align="stretch">
                        <Box>
                            <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1}>CALLBACK URL</Text>
                            <Flex direction={{ base: 'column', sm: 'row' }} align={{ base: 'stretch', sm: 'center' }} gap={2}>
                                <Code p={2} borderRadius="md" bg={codeBg} fontSize="xs" flex={1} minW={0} wordBreak="break-all" whiteSpace="pre-wrap">
                                    {webhookUrl}
                                </Code>
                                <Tooltip label={copiedUrl ? 'Copied!' : 'Copy URL'}>
                                    <IconButton
                                        size="sm"
                                        alignSelf={{ base: 'flex-end', sm: 'auto' }}
                                        icon={<Icon as={copiedUrl ? CheckCheck : Copy} size={14} />}
                                        onClick={copyUrl}
                                        colorScheme={copiedUrl ? 'green' : 'gray'}
                                        aria-label="Copy callback URL"
                                    />
                                </Tooltip>
                            </Flex>
                        </Box>
                        <Box>
                            <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1}>VERIFY TOKEN</Text>
                            <Flex direction={{ base: 'column', sm: 'row' }} align={{ base: 'stretch', sm: 'center' }} gap={2}>
                                <Code p={2} borderRadius="md" bg={codeBg} fontSize="xs" flex={1} minW={0} fontFamily="mono" wordBreak="break-all" whiteSpace="pre-wrap">
                                    {verifyToken}
                                </Code>
                                <Tooltip label={copiedToken ? 'Copied!' : 'Copy Token'}>
                                    <IconButton
                                        size="sm"
                                        alignSelf={{ base: 'flex-end', sm: 'auto' }}
                                        icon={<Icon as={copiedToken ? CheckCheck : Copy} size={14} />}
                                        onClick={copyToken}
                                        colorScheme={copiedToken ? 'green' : 'gray'}
                                        aria-label="Copy verify token"
                                    />
                                </Tooltip>
                            </Flex>
                        </Box>
                        <Alert status="warning" borderRadius="md">
                            <AlertIcon />
                            <Text fontSize="sm">After entering these in Meta, click <strong>Verify and Save</strong>. Then subscribe to the <strong>messages</strong> field.</Text>
                        </Alert>
                    </VStack>
                </Box>
            )}

            {/* Step 4: Test Connection */}
            {status?.isConfigured && (
                <Box bg={cardBg} p={8} mb={6} borderRadius="2xl" border="1px" borderColor={borderColor} boxShadow="sm">
                    <Heading size="md" mb={4} display="flex" alignItems="center" gap={2}>
                        <Text as="span" bg="purple.500" color="white" borderRadius="full" w="28px" h="28px" display="flex" alignItems="center" justifyContent="center" fontSize="sm">4</Text>
                        Test Your Bot
                    </Heading>
                    <HStack spacing={3} flexWrap="wrap" align="stretch">
                        <Input
                            placeholder="Your WhatsApp number (e.g. 919025980641)"
                            value={testPhone}
                            onChange={(e) => setTestPhone(e.target.value.replace(/\D/g, ''))}
                            w={{ base: '100%', sm: '320px' }}
                            fontFamily="mono"
                        />
                        <Button w={{ base: '100%', sm: 'auto' }} colorScheme="green" leftIcon={<Icon as={Send} />} onClick={handleTestConnection} isLoading={testing} loadingText="Sending...">
                            Send Test Message
                        </Button>
                    </HStack>
                </Box>
            )}

            {/* Danger Zone */}
            {status?.isConfigured && (
                <Box p={4} borderRadius="xl" border="1px dashed" borderColor="red.300" mb={6}>
                    <Flex justify="space-between" align={{ base: 'stretch', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={3}>
                        <Box>
                            <Text fontWeight="bold" color="red.500">Disconnect Bot</Text>
                            <Text fontSize="sm" color="gray.500">Clears all credentials. Bot stops responding immediately.</Text>
                        </Box>
                        <Button w={{ base: '100%', md: 'auto' }} colorScheme="red" variant="outline" size="sm" leftIcon={<Icon as={Trash2} />} onClick={handleDisconnect} isLoading={disconnecting}>
                            Disconnect
                        </Button>
                    </Flex>
                </Box>
            )}

            {/* Bot Behavior Settings */}
            {settings && (
                <Box bg={cardBg} p={8} borderRadius="2xl" border="1px" borderColor={borderColor} boxShadow="sm">
                    <Heading mb={6} size="md" display="flex" alignItems="center" gap={3}>
                        <Icon as={SettingsIcon} color="gray.500" />
                        Bot Behavior & Configuration
                    </Heading>
                    <VStack spacing={6} align="stretch">
                        <FormControl display="flex" flexDirection={{ base: 'column', md: 'row' }} alignItems={{ base: 'flex-start', md: 'center' }} justifyContent="space-between" gap={3}>
                            <Box>
                                <FormLabel mb="0" fontWeight="bold">Master Bot Switch</FormLabel>
                                <Text fontSize="sm" color="gray.500">Enable or disable automated replies.</Text>
                            </Box>
                            <Switch colorScheme="brand" size="lg" isChecked={settings.botActive}
                                onChange={(e) => setSettings({ ...settings, botActive: e.target.checked })} />
                        </FormControl>
                        <Divider />
                        <FormControl>
                            <FormLabel fontWeight="bold">Welcome Message</FormLabel>
                            <Textarea
                                value={settings.welcomeMessage}
                                onChange={(e) => setSettings({ ...settings, welcomeMessage: e.target.value })}
                                rows={3}
                            />
                        </FormControl>
                        <Divider />
                        <FormControl display="flex" flexDirection={{ base: 'column', md: 'row' }} alignItems={{ base: 'flex-start', md: 'center' }} justifyContent="space-between" gap={3}>
                            <Box>
                                <FormLabel mb="0" fontWeight="bold">Auto-Receipts</FormLabel>
                                <Text fontSize="sm" color="gray.500">Automatically send digital receipts after purchase.</Text>
                            </Box>
                            <Switch colorScheme="green" size="lg" isChecked={settings.autoReceipts}
                                onChange={(e) => setSettings({ ...settings, autoReceipts: e.target.checked })} />
                        </FormControl>
                        <Divider />
                        <FormControl>
                            <FormLabel fontWeight="bold">Admin Bot Language</FormLabel>
                            <Text fontSize="sm" color="gray.500" mb={2}>Default language for admin WhatsApp bot menu responses</Text>
                            <Select value={settings.language || 'en'} 
                                onChange={(e) => setSettings({ ...settings, language: e.target.value })}>
                                <option value="en">English</option>
                                <option value="ta">Tamil (தமிழ்)</option>
                                <option value="hi">Hindi (हिंदी)</option>
                            </Select>
                        </FormControl>
                        <Divider />
                        <FormControl>
                            <FormLabel fontWeight="bold">Loyalty Points Ratio</FormLabel>
                            <NumberInput step={0.01} min={0} max={1} value={settings.loyaltyRatio}
                                onChange={(_, valNum) => setSettings({ ...settings, loyaltyRatio: valNum })}>
                                <NumberInputField />
                                <NumberInputStepper>
                                    <NumberIncrementStepper /><NumberDecrementStepper />
                                </NumberInputStepper>
                            </NumberInput>
                        </FormControl>
                        <Flex justify="flex-end" pt={4}>
                            <Button colorScheme="brand" leftIcon={<Icon as={Save} />} onClick={handleSaveSettings} isLoading={savingSettings} loadingText="Saving...">
                                Save Settings
                            </Button>
                        </Flex>
                    </VStack>
                </Box>
            )}
        </Box>
    );
}
