import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, DollarSign } from 'lucide-react';
import { apiFetch } from '../utils/api';

function Balances() {
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBalances();
  }, []);

  const fetchBalances = async () => {
    try {
      const data = await apiFetch('/api/balances');
      setBalances(data);
    } catch (error) {
      console.error('Error fetching balances:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const balanceEntries = Object.entries(balances);
  const totalPaid = balanceEntries.reduce((sum, [, b]) => sum + b.paid, 0);
  const totalOwes = balanceEntries.reduce((sum, [, b]) => sum + b.owes, 0);

  if (loading) return <div className="card">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Balances</h1>
        <p>See who owes what in your group</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Paid</div>
          <div className="stat-value positive">${totalPaid.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Owed</div>
          <div className="stat-value negative">${totalOwes.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Net Balance</div>
          <div className={`stat-value ${totalPaid - totalOwes >= 0 ? 'positive' : 'negative'}`}>
            ${(totalPaid - totalOwes).toFixed(2)}
          </div>
        </div>
      </div>

      {balanceEntries.length > 0 ? (
        <div className="balance-grid">
          {balanceEntries.map(([id, balance]) => (
            <div key={id} className="balance-card">
              <div className="balance-card-header">
                <div className="balance-card-avatar">
                  {getInitials(balance.name)}
                </div>
                <div className="balance-card-name">{balance.name}</div>
              </div>

              <div className="balance-card-row">
                <span className="balance-card-label">Total Paid</span>
                <span className="balance-card-value positive">
                  <ArrowUpRight size={14} style={{ display: 'inline' }} />
                  ${balance.paid.toFixed(2)}
                </span>
              </div>

              <div className="balance-card-row">
                <span className="balance-card-label">Total Owes</span>
                <span className="balance-card-value negative">
                  <ArrowDownRight size={14} style={{ display: 'inline' }} />
                  ${balance.owes.toFixed(2)}
                </span>
              </div>

              <div className="balance-card-net">
                <span className="balance-card-net-label">Net Balance</span>
                <span className={`balance-card-net-value ${balance.net >= 0 ? 'positive' : 'negative'}`}>
                  {balance.net >= 0 ? '+' : ''}${balance.net.toFixed(2)}
                </span>
              </div>

              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
                <p style={{ fontSize: 13, color: '#718096', margin: 0 }}>
                  {balance.net > 0 ? (
                    <>{balance.name} should receive ${balance.net.toFixed(2)}</>
                  ) : balance.net < 0 ? (
                    <>{balance.name} should pay ${Math.abs(balance.net).toFixed(2)}</>
                  ) : (
                    <>{balance.name} is all settled up!</>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">⚖️</div>
            <div className="empty-state-title">No balance data yet</div>
            <p>Add players and expenses to see balance calculations</p>
          </div>
        </div>
      )}

      {/* Settlement Summary */}
      {balanceEntries.length > 0 && (
        <div className="card" style={{ marginTop: 24 }}>
          <div className="card-header">
            <h3 className="card-title">Suggested Settlements</h3>
          </div>
          <div className="table-container">
            {(() => {
              // Calculate who should pay whom
              const debtors = balanceEntries
                .filter(([, b]) => b.net < 0)
                .map(([id, b]) => ({ id, name: b.name, amount: Math.abs(b.net) }))
                .sort((a, b) => b.amount - a.amount);
              
              const creditors = balanceEntries
                .filter(([, b]) => b.net > 0)
                .map(([id, b]) => ({ id, name: b.name, amount: b.net }))
                .sort((a, b) => b.amount - a.amount);

              const settlements = [];
              let d = 0, c = 0;
              
              while (d < debtors.length && c < creditors.length) {
                const debtor = debtors[d];
                const creditor = creditors[c];
                const amount = Math.min(debtor.amount, creditor.amount);
                
                if (amount > 0.01) {
                  settlements.push({
                    from: debtor.name,
                    to: creditor.name,
                    amount: amount
                  });
                }
                
                debtor.amount -= amount;
                creditor.amount -= amount;
                
                if (debtor.amount < 0.01) d++;
                if (creditor.amount < 0.01) c++;
              }

              return settlements.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>From</th>
                      <th>To</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settlements.map((s, i) => (
                      <tr key={i}>
                        <td>{s.from}</td>
                        <td>{s.to}</td>
                        <td><strong>${s.amount.toFixed(2)}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state" style={{ padding: 24 }}>
                  <p>All balances are settled! 🎉</p>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

export default Balances;
