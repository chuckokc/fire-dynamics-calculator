import React from 'react';
import * as Chakra from '@chakra-ui/react';
import { CheckCircle, History, Moon } from 'lucide-react';

const Changelog = () => {
  const changes = [
    {
      version: '1.2.0',
      date: 'January 2025',
      icon: <Moon size={20} />,
      features: [
        {
          title: 'Dark Mode Support',
          description: 'Toggle between light and dark themes for comfortable viewing in any lighting condition'
        },
        {
          title: 'Calculation History',
          description: 'Save and recall up to 10 recent calculations for each calculator'
        },
        {
          title: 'Improved Update System',
          description: 'Get notified when new updates are available'
        }
      ]
    },
    {
      version: '1.1.0',
      date: 'January 2025',
      icon: <CheckCircle size={20} />,
      features: [
        {
          title: 'Visual Enhancements',
          description: 'Added visual indicators to Flame Height, Point Source Radiation, and T-Squared calculators'
        },
        {
          title: 'Updated NFPA Standards',
          description: 'Incorporated NFPA 921 (2024) critical values'
        }
      ]
    }
  ];

  return (
    <Chakra.Modal isOpen={true} onClose={() => {}} size="lg">
      <Chakra.ModalOverlay />
      <Chakra.ModalContent>
        <Chakra.ModalHeader>What's New in Fire Dynamics Calculator</Chakra.ModalHeader>
        <Chakra.ModalBody>
          <Chakra.VStack align="stretch" spacing={6}>
            {changes.map((release) => (
              <Chakra.Box key={release.version}>
                <Chakra.HStack mb={3}>
                  <Chakra.Box color="blue.500">{release.icon}</Chakra.Box>
                  <Chakra.VStack align="start" spacing={0}>
                    <Chakra.Text fontWeight="bold" fontSize="lg">
                      Version {release.version}
                    </Chakra.Text>
                    <Chakra.Text fontSize="sm" color="gray.500">
                      {release.date}
                    </Chakra.Text>
                  </Chakra.VStack>
                </Chakra.HStack>
                <Chakra.VStack align="stretch" spacing={2} pl={8}>
                  {release.features.map((feature, idx) => (
                    <Chakra.Box key={idx}>
                      <Chakra.Text fontWeight="semibold">{feature.title}</Chakra.Text>
                      <Chakra.Text fontSize="sm" color="gray.600">
                        {feature.description}
                      </Chakra.Text>
                    </Chakra.Box>
                  ))}
                </Chakra.VStack>
              </Chakra.Box>
            ))}
          </Chakra.VStack>
        </Chakra.ModalBody>
        <Chakra.ModalFooter>
          <Chakra.Button colorScheme="blue" onClick={() => window.location.reload()}>
            Got it!
          </Chakra.Button>
        </Chakra.ModalFooter>
      </Chakra.ModalContent>
    </Chakra.Modal>
  );
};

export default Changelog;