import Evento from '../models/Evento.js';

class EventService {
  async createEvent(eventData) {
    try {
      const event = new Evento(eventData);
      return await event.save();
    } catch (error) {
      throw new Error(`Error creating event: ${error.message}`);
    }
  }

  async getEvents(page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;
      const [events, total] = await Promise.all([
        Evento.find()
          .skip(skip)
          .limit(limit)
          .populate('recinto sala')
          .lean(),
        Evento.countDocuments()
      ]);

      return {
        events,
        total,
        page,
        pages: Math.ceil(total / limit)
      };
    } catch (error) {
      throw new Error(`Error getting events: ${error.message}`);
    }
  }

  async getEventById(id) {
    try {
      const event = await Evento.findById(id)
        .populate('recinto sala')
        .lean();
      if (!event) {
        throw new Error('Event not found');
      }
      return event;
    } catch (error) {
      throw new Error(`Error getting event: ${error.message}`);
    }
  }

  async updateEvent(id, updateData) {
    try {
      const event = await Evento.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('recinto sala');
      
      if (!event) {
        throw new Error('Event not found');
      }
      return event;
    } catch (error) {
      throw new Error(`Error updating event: ${error.message}`);
    }
  }

  async deleteEvent(id) {
    try {
      const event = await Evento.findByIdAndDelete(id);
      if (!event) {
        throw new Error('Event not found');
      }
      return event;
    } catch (error) {
      throw new Error(`Error deleting event: ${error.message}`);
    }
  }
}

export default new EventService();
