import { NextApiRequest, NextApiResponse } from 'next';
import { getTrackingInfo, createTrackingRequest } from '@/lib/db/queries';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        const { trackingNumber } = req.query;

        try {
            const trackingInfo = await getTrackingInfo(trackingNumber as string);
            if (!trackingInfo) {
                return res.status(404).json({ message: 'Tracking information not found' });
            }
            return res.status(200).json(trackingInfo);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    } else if (req.method === 'POST') {
        const { trackingNumber, shipmentDetails } = req.body;

        try {
            const newTracking = await createTrackingRequest(trackingNumber, shipmentDetails);
            return res.status(201).json(newTracking);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}