const margin = {top: 20, right: 100, bottom: 50, left: 200},
      width = 1650 - margin.left - margin.right,
      height = 800 - margin.top - margin.bottom;

const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("display", "none"); // Dùng display thay vì opacity

d3.csv("data_ggsheet.csv").then(rawData => {
    rawData.forEach(d => {
        d["Thành tiền"] = +d["Thành tiền"];
    });

    const spendingByCustomer = d3.rollups(
        rawData,
        v => d3.sum(v, d => d["Thành tiền"]),
        d => d["Mã khách hàng"]
    );

    const formatNumber = d3.format(",");
    const binSize = 50000;
    const binsMap = new Map();

    spendingByCustomer.forEach(([customerId, totalSpend]) => {
        const binIndex = Math.floor(totalSpend / binSize);
        const lowerBound = binIndex * 50000;
        const upperBound = lowerBound + 50000;
        const binLabel = `${upperBound / 1000}K`;

        const lowerFormatted = formatNumber(lowerBound);
        const upperFormatted = formatNumber(upperBound);
        const tooltipLabel = `Mức chi trả: từ ${lowerFormatted} đến ${upperFormatted}`;

        if (!binsMap.has(binLabel)) {
            binsMap.set(binLabel, { count: 0, tooltip: tooltipLabel, lower: lowerBound, upper: upperBound });
        }

        const binData = binsMap.get(binLabel);
        binData.count += 1;
    });

    const data = Array.from(binsMap, ([label, { count, tooltip, lower, upper }]) => ({
        label,
        count,
        tooltip,
        lower,
        upper
    })).sort((a, b) => a.lower - b.lower);

    console.log("Phân phối mức chi trả:", data);

    const x = d3.scaleBand()
        .domain(data.map(d => d.label))
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.count)])
        .nice()
        .range([height, 0]);

    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x).tickFormat(""))
        .selectAll("text")
        .remove();

    svg.append("g")
        .call(d3.axisLeft(y))
        .selectAll("text")
        .style("font-size", "12px");

    svg.selectAll(".bar")
        .data(data)
        .join("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.label))
        .attr("y", d => y(d.count))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.count))
        .attr("fill", "#00C5CD")
        .on("mouseover", (event, d) => {
            const lowerFormatted = d.lower.toLocaleString('vi-VN');
            const upperFormatted = d.upper.toLocaleString('vi-VN');

            tooltip.html(`
                <strong>Mức chi trả: Từ ${lowerFormatted} đến ${upperFormatted}</strong><br/>
                Số lượng KH: ${d.count.toLocaleString('vi-VN')}
            `)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px")
            .style("display", "block");
        })
        .on("mouseout", () => {
            tooltip.style("display", "none");
        });

}).catch(error => {
    console.error("Lỗi load dữ liệu:", error);
});
