# Sales Reports Design Plan

## Metrics

- **Monthly Revenue**: `settings.data.payments` filtered by current month.
- **Payment Method Breakdown**: Count and amount for Card, Cash, Transfer.
- **Top Products**: Products contributing most to revenue.
- **Historical Trend**: Revenue summed by month for the last 6 months.

## UI Components

- **Stats Card Row**: Total Sales, Average Ticket Size, Transaction Count.
- **Chart Section**: Payment Method pie-style breakdown (using CSS/HTML bars since no chart lib is specified, or keeping it clean with lists).
- **Monthly Table**: Breakdown of sales by day for the selected month.
