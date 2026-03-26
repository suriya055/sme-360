import React from 'react';
import { 
  Box, Heading, VStack, Text, Badge, Flex, IconButton,
  Card, CardBody, useColorModeValue
} from '@chakra-ui/react';
import { Bell, Check, X, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useApp } from '../hooks/useApp';

const NotificationItem = ({ notification }) => {
  const { markNotificationAsRead } = useApp();
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const getIcon = (type) => {
    switch(type) {
      case 'alert': return AlertCircle;
      case 'success': return CheckCircle;
      default: return Info;
    }
  };

  const getColorScheme = (type) => {
    switch(type) {
      case 'alert': return 'red';
      case 'success': return 'green';
      default: return 'blue';
    }
  };

  const IconComponent = getIcon(notification.type);

  return (
    <Card 
      bg={bg} 
      border="1px" 
      borderColor={borderColor}
      opacity={notification.read ? 0.7 : 1}
      transition="all 0.2s"
      _hover={{ transform: 'translateX(4px)', shadow: 'md' }}
    >
      <CardBody>
        <Flex justify="space-between" align="flex-start">
          <Flex gap={3} flex={1}>
            <Box mt={1}>
              <IconComponent size={20} color={getColorScheme(notification.type)} />
            </Box>
            <Box flex={1}>
              <Text fontWeight="bold">{notification.title}</Text>
              <Text fontSize="sm" mt={1} color="gray.600">{notification.message}</Text>
              <Text fontSize="xs" color="gray.500" mt={2}>{notification.time}</Text>
            </Box>
          </Flex>
          {!notification.read && (
            <IconButton
              icon={<Check size={16} />}
              size="sm"
              variant="ghost"
              onClick={() => markNotificationAsRead(notification.id)}
              aria-label="Mark as read"
            />
          )}
        </Flex>
        <Badge 
          colorScheme={getColorScheme(notification.type)} 
          variant="subtle"
          size="sm"
          mt={2}
        >
          {notification.type}
        </Badge>
      </CardBody>
    </Card>
  );
};

export default function Notifications() {
  const { notifications, markAllNotificationsAsRead, unreadNotificationsCount } = useApp();
  const unreadCount = unreadNotificationsCount;

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg">Notifications</Heading>
          <Text color="gray.500" mt={1}>
            {unreadCount > 0 
              ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` 
              : 'All caught up!'}
          </Text>
        </Box>
        {unreadCount > 0 && (
          <IconButton
            icon={<Check />}
            colorScheme="brand"
            onClick={markAllNotificationsAsRead}
            aria-label="Mark all as read"
          />
        )}
      </Flex>

      {notifications.length === 0 ? (
        <Flex 
          direction="column" 
          align="center" 
          justify="center" 
          h="400px" 
          color="gray.400"
        >
          <Bell size={48} />
          <Text mt={4} fontSize="lg">No notifications yet</Text>
          <Text fontSize="sm">Your notifications will appear here</Text>
        </Flex>
      ) : (
        <VStack spacing={3} align="stretch">
          {notifications.map(notification => (
            <NotificationItem key={notification.id} notification={notification} />
          ))}
        </VStack>
      )}
    </Box>
  );
}
