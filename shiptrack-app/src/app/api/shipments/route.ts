import { NextApiRequest, NextApiResponse } from 'next';
import { getShipments, createShipment, updateShipment, deleteShipment } from '@/lib/db/queries';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    switch (req.method) {
        case 'GET':
            try {
                const shipments = await getShipments();
                res.status(200).json(shipments);
            } catch (error) {
                res.status(500).json({ error: 'Failed to fetch shipments' });
            }
            break;

        case 'POST':
            try {
                const shipmentData = req.body;
                const newShipment = await createShipment(shipmentData);
                res.status(201).json(newShipment);
            } catch (error) {
                res.status(400).json({ error: 'Failed to create shipment' });
            }
            break;

        case 'PUT':
            try {
                const { id, ...updateData } = req.body;
                const updatedShipment = await updateShipment(id, updateData);
                res.status(200).json(updatedShipment);
            } catch (error) {
                res.status(400).json({ error: 'Failed to update shipment' });
            }
            break;

        case 'DELETE':
            try {
                const { id } = req.body;
                await deleteShipment(id);
                res.status(204).end();
            } catch (error) {
                res.status(400).json({ error: 'Failed to delete shipment' });
            }
            break;

        default:
            res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
            res.status(405).end(`Method ${req.method} Not Allowed`);
            break;
    }
}