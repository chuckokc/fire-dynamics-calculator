/* eslint-disable react/prop-types */
import { useState } from 'react';
import * as Chakra from '@chakra-ui/react';
import { FEEDBACK_FORM, submitForm } from '../sendForm';

// Feedback goes to the site owner through Netlify Forms, so nobody needs an email
// app and the owner's address is never shown. The email field is optional and is
// only for people who would like a reply.
const FeedbackModal = ({ isOpen, onClose, appVersion }) => {
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [botField, setBotField] = useState(''); // hidden trap field: people leave it empty
  const [status, setStatus] = useState('idle'); // idle | sending | sent | failed

  const close = () => {
    if (status === 'sent') {
      setMessage('');
      setEmail('');
    }
    setStatus('idle');
    onClose();
  };

  const send = async (event) => {
    event.preventDefault();
    if (!message.trim() || status === 'sending') return;
    setStatus('sending');
    setStatus(
      await submitForm(FEEDBACK_FORM.name, {
        subject: FEEDBACK_FORM.subject,
        'bot-field': botField,
        message: message.trim(),
        email: email.trim(),
        app_version: appVersion,
      })
    );
  };

  return (
    <Chakra.Modal isOpen={isOpen} onClose={close} isCentered size="lg">
      <Chakra.ModalOverlay />
      <Chakra.ModalContent as="form" onSubmit={send} mx={3}>
        <Chakra.ModalHeader>Provide Feedback</Chakra.ModalHeader>
        <Chakra.ModalCloseButton />
        <Chakra.ModalBody>
          {status === 'sent' ? (
            <Chakra.Alert status="success" borderRadius="md" role="status">
              <Chakra.AlertIcon />
              Thank you! Your feedback was sent.
            </Chakra.Alert>
          ) : (
            <Chakra.VStack spacing={4} align="stretch">
              <Chakra.Box position="absolute" left="-9999px" aria-hidden="true">
                <label>
                  Leave this empty
                  <input
                    name="bot-field"
                    tabIndex={-1}
                    autoComplete="off"
                    value={botField}
                    onChange={(e) => setBotField(e.target.value)}
                  />
                </label>
              </Chakra.Box>
              <Chakra.FormControl isRequired>
                <Chakra.FormLabel>Your message</Chakra.FormLabel>
                <Chakra.Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  maxLength={3000}
                  placeholder="What worked, what didn't, what you would like to see..."
                />
              </Chakra.FormControl>
              <Chakra.FormControl>
                <Chakra.FormLabel>Your email address (optional)</Chakra.FormLabel>
                <Chakra.Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={200}
                  autoComplete="email"
                />
                <Chakra.FormHelperText>Only if you would like a reply.</Chakra.FormHelperText>
              </Chakra.FormControl>
              {status === 'failed' && (
                <Chakra.Alert status="error" borderRadius="md" role="alert">
                  <Chakra.AlertIcon />
                  Sorry, that did not send. Please try again in a few minutes.
                </Chakra.Alert>
              )}
            </Chakra.VStack>
          )}
        </Chakra.ModalBody>
        <Chakra.ModalFooter gap={2}>
          {status === 'sent' ? (
            <Chakra.Button colorScheme="blue" onClick={close}>
              Close
            </Chakra.Button>
          ) : (
            <>
              <Chakra.Button variant="ghost" onClick={close}>
                Cancel
              </Chakra.Button>
              <Chakra.Button type="submit" colorScheme="blue" isLoading={status === 'sending'} loadingText="Sending">
                Send feedback
              </Chakra.Button>
            </>
          )}
        </Chakra.ModalFooter>
      </Chakra.ModalContent>
    </Chakra.Modal>
  );
};

export default FeedbackModal;
