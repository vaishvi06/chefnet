import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Send, Phone, ArrowLeft, CheckCheck, Check, Clock } from 'lucide-react';
import { chatApi } from '../../api/chatApi';
import { subscriptionApi } from '../../api/subscriptionApi';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatTime } from '../../utils/formatters';

export const CustomerChatPage = () => {
  const { subscriptionId } = useParams();
  const { user } = useAuth();
  const { socket, joinSubscription, sendMessage, markRead } = useSocket();

  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  // Load subscription details to show chef info and phone
  const { data: subData } = useQuery({
    queryKey: ['subscription', subscriptionId],
    queryFn: () => subscriptionApi.getSubscriptions(),
    select: (data) => data?.data?.subscriptions?.find((s) => s._id === subscriptionId)
  });

  const subscription = subData;

  // Load message history
  const { data: historyData, isLoading } = useQuery({
    queryKey: ['chatMessages', subscriptionId],
    queryFn: () => chatApi.getSubscriptionMessages(subscriptionId),
    enabled: !!subscriptionId
  });

  useEffect(() => {
    if (historyData?.data?.messages) {
      setMessages(historyData.data.messages);
    }
  }, [historyData]);

  // Join Socket.io room and attach event listeners
  useEffect(() => {
    if (subscriptionId) {
      joinSubscription(subscriptionId);
    }

    if (!socket) return;

    const handleReceive = (newMsg) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === newMsg._id)) return prev;
        return [...prev, newMsg];
      });

      // If received from chef, mark read
      if (newMsg.sender?._id !== user?._id) {
        markRead(newMsg._id);
      }
    };

    const handleRead = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, readAt: new Date().toISOString() } : m))
      );
    };

    socket.on('receive_message', handleReceive);
    socket.on('message_read', handleRead);

    return () => {
      socket.off('receive_message', handleReceive);
      socket.off('message_read', handleRead);
    };
  }, [socket, subscriptionId, joinSubscription, markRead, user?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    // Send via socket
    sendMessage(subscriptionId, inputText.trim());
    setInputText('');
  };

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-12rem)] flex flex-col bg-white rounded-2xl border border-cream-300 shadow-warm overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 bg-cream-50 border-b border-cream-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/subscriptions" className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-800 font-bold flex items-center justify-center text-xs uppercase overflow-hidden">
            {subscription?.chef?.photoUrl ? (
              <img src={subscription.chef.photoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              subscription?.chef?.name?.charAt(0) || 'C'
            )}
          </div>
          <div>
            <h3 className="font-serif font-bold text-sm text-neutral-900 leading-tight">
              {subscription?.chef?.chefProfile?.kitchenName || subscription?.chef?.name || 'Chef'}
            </h3>
            <p className="text-[11px] text-neutral-500">
              {subscription?.planType} • {subscription?.mealPlan?.replace('_', ' ')} plan
            </p>
          </div>
        </div>

        {/* Revealed Phone Number */}
        {subscription?.chef?.phone && (
          <a
            href={`tel:${subscription.chef.phone}`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold hover:bg-emerald-100 transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-600" />
            <span>{subscription.chef.phone}</span>
          </a>
        )}
      </div>

      {/* Message List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-cream-50/30">
        {isLoading ? (
          <div className="space-y-3 p-4">
            <Skeleton variant="text" count={4} />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-neutral-400 text-xs">
            <p>Direct chat unlocked for accepted subscription.</p>
            <p className="mt-1">Say hello to arrange pickup timings or discuss dietary tastes!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender?._id === user?._id || msg.sender === user?._id;

            return (
              <div
                key={msg._id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs shadow-2xs leading-relaxed ${
                    isMe
                      ? 'bg-primary-600 text-white rounded-br-xs'
                      : 'bg-white text-neutral-800 border border-cream-200 rounded-bl-xs'
                  }`}
                >
                  <p>{msg.text}</p>
                </div>

                <div className="flex items-center gap-1 mt-1 text-[10px] text-neutral-400 px-1">
                  <span>{formatTime(msg.sentAt || msg.createdAt)}</span>
                  {isMe && (
                    <span>
                      {msg.readAt ? (
                        <CheckCheck className="w-3 h-3 text-primary-600" />
                      ) : (
                        <Check className="w-3 h-3 text-neutral-400" />
                      )}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-cream-200 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message to your home chef..."
          className="flex-1 rounded-xl bg-cream-50 border border-cream-300 px-4 py-2.5 text-xs text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={!inputText.trim()}
          icon={Send}
        >
          <span>Send</span>
        </Button>
      </form>
    </div>
  );
};

