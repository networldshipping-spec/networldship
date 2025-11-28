INSERT INTO shipments (tracking_number, status, created_at) VALUES
('TRACK123456', 'In Transit', NOW()),
('TRACK654321', 'Delivered', NOW()),
('TRACK789012', 'Pending', NOW());

INSERT INTO users (username, password, email) VALUES
('user1', 'hashed_password1', 'user1@example.com'),
('user2', 'hashed_password2', 'user2@example.com');

INSERT INTO shipment_updates (shipment_id, update_time, status) VALUES
(1, NOW(), 'Package picked up'),
(1, NOW() + INTERVAL '1 day', 'Arrived at sorting facility'),
(2, NOW(), 'Out for delivery'),
(3, NOW(), 'Label created');